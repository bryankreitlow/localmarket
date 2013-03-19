/*jslint node:true, es5:true */
"use strict";

var winston = require('winston');
var _ = require("underscore");

// use the syslog levels:
//   debug
//   info
//   notice
//   warning
//   error
//   crit
//   alert
//   emerg
var levels = winston.config.syslog.levels;
var wLogger = new (winston.Logger)({
  levels: levels
});

// Configure the message logger.  Can be initted with no options (defaults to console/syslog in that case)
exports.configure = function(options) {
  if (!options) {
    options = {};
  }

  var level = 'info';
  if (options.levelDebug) {
    level = 'debug';
  }
  //wLogger.level = level;

  var messageLog = options.messageLog;
  var maxsize = options.messageLogMaxSize;
  if (messageLog === undefined) {
    messageLog = "<consoleAndSyslog>";
  }
  if (maxsize === undefined) { // for file transports
    maxsize = 10000000;
  }

  var transports = [];

  if (messageLog === "<console>" || messageLog === "<consoleAndSyslog>") {
    transports.push({
      t: winston.transports.Console, args: { level: level, json: false, colorize: true }
    });
  } else if (process.platform === 'linux' && (messageLog === "<syslog>" || messageLog === "<consoleAndSyslog>")) {
    // Would be nice to support this, but winston-syslog doesn't work for us now; node has dropped support
    // for unix dgram sockets, udp sockets require a bind to port 514 (root), and tcp sockets don't appear to work
    // with rsyslog (what we use).  So punting for now.
    console.log("syslog not supported");
  } else {
    // assume its a file
    transports.push({t: winston.transports.File, args: {
      level: level, filename: messageLog, json: false, colorize: false, maxsize: maxsize, prettyPrint: false, timestamp: true
    }});
  }

  // remove previous transports
  wLogger.clear();

  if (transports.length > 0) {
    _.each(transports, function(params) {
      wLogger.add(params.t,params.args);
    });
  } else {
    console.log("Warning: No message log initialized");
  }

  wLogger.exitOnError = false;
};

// export the level functions
_.each(levels, function(i,k) {
  exports[k] = function(msg,meta,callback) {
    var logCat = "NoCategory";

    // prepend the category, if defined
    if (typeof(meta)==='string') {
      logCat = meta;
      meta = undefined;
    } else if (meta && meta.cat) {
      logCat = meta.cat;
      delete meta.cat;
    }
    msg = '[' + logCat + '] ' + msg;
    wLogger[k].call(wLogger,msg,meta,callback);
  };
});