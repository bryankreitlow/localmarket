/*jslint node:true, es5:true */

var path = require('path'),
    config = require('./util/Config'),
    configExpress = require('./util/ExpressConfig'),
    dbconnect = require('./util/Mongo'),
    cluster = require('cluster'),
    reqLogger = require('./util/ReqLogger'),
    logger = require('./util/Logger'),
    _ = require('underscore'),
    express = require('express.io'),
    passport = require('passport'),
    auth = require('./util/middleware/authorization');

// Bring in dust for consolidate.js
require('dustjs-linkedin');
require('dustjs-helpers');

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

// Initialize a shared viewContext
var sharedContext = {
  isProduction: config.isProduction()
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
        buildPageContext = require('./routes/utils/ContextUtil').buildPageContext,
        mapRoutes = require('./routes/map/map'),
        accountRoutes = require('./routes/account/Accounts'),
        marketfinderRoutes = require('./routes/marketfinder/marketfinder'),
        marketingRoutes = require('./routes/marketing/Marketing'),
        entryRoutes = require('./routes/entries/Entries'),
        suggestionRoutes = require('./routes/marketing/Suggestions'),
        foodRoutes = require('./routes/food/foods');

      var serverPort = config.get(config.NodeServerPort);

      // configure express request log
      reqLogger.configure({
        express: app,
        accessLog: config.get(config.AccessLog),
        accessLogMaxSize: config.get(config.AccessLogMaxSize)
      });

      // Configure passport
      require('./util/Passport')(passport);

      //Configure Server
      configExpress(app, config, passport, sharedContext);

      mapRoutes(app, sharedContext);
      accountRoutes(app, sharedContext, passport, auth);
      entryRoutes(app, sharedContext, passport, auth);
      marketfinderRoutes(app, sharedContext, passport, auth);
      suggestionRoutes(app, sharedContext, passport, auth);
      foodRoutes(app, sharedContext, passport, auth);
      marketingRoutes(app, sharedContext);

      app.io.set('log level', 1);
      app.io.enable('browser client minification');  // send minified client
      app.io.enable('browser client etag');          // apply etag caching logic based on version number
      app.io.enable('browser client gzip');          // gzip the file
      app.io.configure(function () {
        app.io.set('store', socketStore);
      });

      // log errors
      app.use(function errorHandler(err, req, res, next) {
        try {
          logger.error("Node error:", LogCategory);
          logger.error(err.stack, LogCategory);
          logger.error("Request:", LogCategory);
          logger.error(JSON.stringify(_.pick(req, "httpVersion", "method", "originalUrl", "body", "params", "headers"), undefined, "  "), LogCategory);
          logger.error("Response:", LogCategory);
          logger.error(JSON.stringify(_.pick(res, "statusCode", "body", "output", "_headers"), undefined, "  "), LogCategory);
        }
        catch (exception) {
          // hope this doesn't happen very often...
          console.log(exception);
        }
        if(err instanceof NotFound) {
          console.log('[Page Not Found] ' + req.originalUrl);
          res.status(404).render('error/404', buildPageContext(req, sharedContext));
        } else {
          console.log('[Internal Server Error] ' + req.originalUrl);
          res.status(500).render('error/500', { error: err.stack });
        }
      });

      // Development Settings
      app.configure(config.ConfigDevelopment, function () {
        app.use(express.errorHandler({
          dumpExceptions: true,
          showStack: true
        }));
      });

      // Production Settings
      app.configure(config.ConfigProduction, function () {
        app.use(express.errorHandler());
      });

      //A Route for Creating a 500 Error (Useful to keep around)
      app.get('/500', function(req, res){
        throw new Error('This is a 500 Error');
      });

      //The 404 Route (ALWAYS Keep this as the last route)
      app.get('/*', function(req, res){
        throw new NotFound;
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

function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}