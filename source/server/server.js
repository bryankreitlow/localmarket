/*jslint node:true, es5:true */

var path = require('path'),
    config = require('./util/Config'),
    dbconnect = require('./util/Mongo'),
    cluster = require('cluster'),
    reqLogger = require('./util/ReqLogger'),
    logger = require('./util/Logger'),
    _ = require('underscore'),
    express = require('express.io'),
    passport = require('passport'),
    auth = require('./util/middleware/authorization');

// Init store for shared sockets on clusters
var socketStore = new (require('socket.io-clusterhub'));

// Set this to true if you don't want the cluster to run.
var debugEnv = false || process.env.NODE_ENV === "debug";

// configure logger (on both cluster master and workers)
logger.configure();

var LogCategory = "Server";

// Initialize the config, but make it silent on the workers to reduce log spew
if (!config.initialize({ silent: !cluster.isMaster })) {
  logger.error("Unable to load a config file. Aborting.",LogCategory);
  process.exit(1);
}

// re-configure logger (config has changed)
logger.configure({
  messageLog: config.get(config.MessageLog),
  messageLogMaxSize: config.get(config.MessageLogMaxSize),
  levelDebug: config.isDebug() || config.isDevelopment()
});

var workerExitUnknown = 20;
var workerExitCannotBind = 47;

var workerOnExit = function(code, signal) {
  "use strict";
  if( signal ) {
    logger.info("worker was killed by signal: "+signal,LogCategory);
  } else if( code !== 0 ) {
    logger.info("worker exited with error code: "+code,LogCategory);
  }

  // respawn the worker as long at didn't die to to an error binding to the port
  if (code !== workerExitCannotBind) {
    logger.info('Respawning worker', LogCategory);
    var worker = cluster.fork();
    worker.on('exit', workerOnExit);
  }
};

if (!debugEnv && cluster.isMaster) {
  logger.info("Cluster master started", LogCategory);
  var clusterSize = config.get(config.NodeClusterSize);
  if (!clusterSize) {
    // Autodetecting based on number of CPUs isn't a good idea, because hyperthread units
    // get counted as full CPUs
    clusterSize = 8;
    logger.info('Using hardcoded cluster size: ' + clusterSize, LogCategory);
  } else {
    logger.info("Using configured cluster size: " + clusterSize, LogCategory);
  }
  for (var i = 0; i < clusterSize; ++i) {
    var worker = cluster.fork();
    worker.on('exit', workerOnExit);
  }
} else {
  //Init the DB
  dbconnect.initialize(function (result) {
    "use strict";
    if (result) {
      logger.info("Connection Successful to MongoDB Host", "Mongo");
      var app = express().http().io(),
        routes = require('./routes'),
        models = require('./models')();

      var serverPort = config.get(config.NodeServerPort);

      // configure express request log
      reqLogger.configure({
        express: app,
        accessLog: config.get(config.AccessLog),
        accessLogMaxSize: config.get(config.AccessLogMaxSize)
      });

      // Configure passport
      require('./util/Passport')(passport);

      // Configure routes
      routes(app, passport, auth);

      app.io.set('log level', 1);
      app.io.enable('browser client minification');  // send minified client
      app.io.enable('browser client etag');          // apply etag caching logic based on version number
      app.io.enable('browser client gzip');          // gzip the file
      app.io.configure(function () {
        app.io.set('store', socketStore);
      });

      // Start server on listen port.
      var workerId = debugEnv ? "debug" : cluster.worker.id;
      var hServer = app.listen(serverPort);
      hServer.on('error', function (e) {
        logger.error('Worker #' + workerId + ' received error ' + e.code + ' on syscall ' + e.syscall, LogCategory);
        if (e.code === 'EACCES' || e.code === 'EADDRINUSE') {
          process.exit(workerExitCannotBind);
        }
        process.exit(workerExitUnknown);
      });
      logger.info('Worker #' + workerId + ' started on http://localhost:' + serverPort, LogCategory);
    } else {
      logger.error("Unable to connect to db. Error " + result + ". ", 'Mongo');
      process.exit(1);
    }
  });
}
