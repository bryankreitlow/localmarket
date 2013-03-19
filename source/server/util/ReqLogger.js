/*jslint node:true, es5:true */
"use strict";

var logger = require ("./Logger");
var winston = require("winston");
var fs = require("fs");

exports.configure = function(options) {
  if (!options) {
    options = {};
  }
  if (!options.express) {
    return;
  }

  var accessLog = options.accessLog;
  var maxsize = options.accessLogMaxSize;
  if (!accessLog) {
    accessLog = ""; // no access logging
  }
  if (maxsize === undefined) { // for file transports
    maxsize = 10000000;
  }

  // check for "<console>" magic string
  if (accessLog.toLowerCase() === "<console>") {
    var logFn = function(line) {
      console.log("req",line);
    };
    options.express.use(accessLogFunction(logFn));
  } else if (accessLog.length > 0) {
    // its a file (we don't support syslog for the access log), open a stream
    try {
      // check that we can write to the file now, instead of finding that we can't when winston first tries to write to
      // it.  This will throw an exception if it fails.
      var file = fs.openSync(accessLog, "a");
      fs.closeSync(file);

      // use a winston file transport
      var transport = new winston.transports.File({
        filename: accessLog, json: false, colorize: false, maxsize: maxsize, prettyPrint: false, timestamp: false
      });
      var logFn = function(line) {
        transport.log("req", line, undefined, function() {});
      };
      options.express.use(accessLogFunction(logFn));
    } catch (exception) {
      logger.error(exception);
    }
  }
}

// This was ripped from the express "connect" lib (MIT license) and modified.  The logger is too inflexible to be used
// with a logging lib like winston, so we have to do it (with some copy/paste help from connect)
var immediate = false;

var remoteaddr = function(req) {
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'];
  }
  if (req.ip) {
    return req.ip;
  }
  var sock = req.socket;
  if (sock.socket) {
    return sock.socket.remoteAddress;
  }
  return sock.remoteAddress;
};

var get = function(val,defaultVal) {
  if (val === undefined) {
    return defaultVal;
  } else {
    return val;
  }
};

var fmt = function (exports, req, res) {
//:remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
  return remoteaddr(req)
    + " - - [" + new Date().toUTCString() + "] \""
    + req.method + " " + (req.originalUrl || req.url) + " HTTP/" + (req.httpVersionMajor + '.' + req.httpVersionMinor)
    + "\" " + res.statusCode
    + " " + get(res.getHeader('Content-Length'), "NoSize")
    + " \"" + get((req.headers['referer'] || req.headers['referrer']), "NoRef") + "\""
    + " \"" + (req.headers['user-agent']) + "\"";
}

var accessLogFunction = function(logFn) {
  return function logger(req, res, next) {
    req._startTime = new Date();

    // immediate
    if (immediate) {
      var line = fmt(exports, req, res);
      if (null === line) {
        return;
      }
      logFn(line);
      // proxy end to output logging
    } else {
      var end = res.end;
      res.end = function (chunk, encoding) {
        res.end = end;
        res.end(chunk, encoding);
        var line = fmt(exports, req, res);
        if (null === line) {
          return;
        }
        logFn(line);
      };
    }

    next();
  };
};