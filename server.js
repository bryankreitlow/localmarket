/*jslint node:true, es5:true */

var path = require('path'),
    config = require('./source/server/util/Config'),
    dbconnect = require('./source/server/util/Mongo'),
    cluster = require('cluster'),
    reqLogger = require('./source/server/util/ReqLogger'),
    logger = require('./source/server/util/Logger'),
    _ = require('underscore'),
    express = require('express.io'),
    passport = require('passport'),
    swig = require('swig'),
    auth = require('./source/server/util/middleware/authorization');

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
      var app = express();
        app.http();
        app.io();

      var routes = require('./source/server/routes'),
        models = require('./source/server/models')();

      // Configure Socket.io
      app.io.configure('development', function () {
        app.io.enable('browser client minification');  // send minified client
        app.io.enable('browser client etag');          // apply etag caching logic based on version number
        app.io.enable('browser client gzip');          // gzip the file
        app.io.set('log level', 3);
        app.io.set('store', socketStore);
      });

      var serverPort = config.get(config.NodeServerPort);

      // configure express request log
      reqLogger.configure({
        express: app,
        accessLog: config.get(config.AccessLog),
        accessLogMaxSize: config.get(config.AccessLogMaxSize)
      });

      // Configure passport
      require('./source/server/util/Passport')(passport);

      // NOTE: Swig requires some extra setup
      // This helps it know where to look for includes and parent templates
      swig.init({
        root: __dirname + '/views',
        cache: false,
        tags: {
          imgsrc:require('./source/server/swig/imgsrc.js')
        },
        allowErrors: false // allows errors to be thrown and caught by express instead of suppressed by Swig
      });

      // should be placed before express.static
      app.use(express.compress({
        filter: function (req, res) {
          return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
      }));

      app.use("/assets", express.static('./static/assets'));
      //Fav icon
      app.use(express.favicon('./static/favicon/favicon.ico', { maxAge: 2592000000 }));

      // Configure routes
      routes(app, passport, auth);

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
