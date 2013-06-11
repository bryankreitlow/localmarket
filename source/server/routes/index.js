/*jslint node:true, es5:true */

var _ = require('underscore');
var config = require('../util/Config');
var configExpress = require('../util/ExpressConfig');
var logger = require("../util/Logger");
var express = require('express.io');
var fs = require('fs');

var LogCategory = 'Route Attacher';

var getRoutes = function(path) {
  "use strict";
  var routes = [];
  var traverseFileSystem = function (currentPath) {
    var files = fs.readdirSync(currentPath);
    for (var i in files) {
      if (files.hasOwnProperty(i)) {
        var currentFile = currentPath + '/' + files[i];
        var stats = fs.statSync(currentFile);
        if (stats.isFile() && (/\.(js)$/i).test(currentFile) && currentFile !== __filename) {
          routes.push(currentFile);
        } else if (stats.isDirectory()) {
          traverseFileSystem(currentFile);
        }
      }
    }
  };
  traverseFileSystem(path);
  return routes;
};

// Initialize a shared viewContext
var sharedContext = {
  isProduction: config.isProduction(),
  View: {
    Title: 'Localmart 2013'
  }
};

var buildPageContext = function(req, additions) {
  "use strict";
  var userName = false;
  if(req.user) {
    userName = req.user.fullName();
  }
  return _.extend({}, additions, {userName: userName}, sharedContext);
};

var routes = getRoutes(__dirname);

module.exports = function(app, passport, auth) {
  "use strict";

  //Configure Server
  configExpress(app, config, passport, sharedContext);

  // Hook up the routes contained in the subdirs within routes
  _.forEach(routes, function(route) {
    require(route)(app, buildPageContext, passport, auth);
  });

  // log errors
  app.use(function errorHandler(err, req, res, next) {
    if(err instanceof NotFound) {
      console.log('[Page Not Found] ' + req.originalUrl);
      res.status(404).render('error/404', buildPageContext(req, sharedContext));
    } else {
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
      console.log('[Internal Server Error] ' + req.originalUrl);
      res.status(500).render('error/500', buildPageContext(req, { error: err.stack }, sharedContext));
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
};

// Page NotFound Error Function
function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}
