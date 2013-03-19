/*jslint node:true, es5:true */
"use strict";

var os = require('os');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var logger = require("./Logger");

// Set these on a module level so that it is only looked up once no matter how many times
// this module is required.
var hostname = os.hostname();
var currentConfig = null;

var LogCategory = "Config";

var Config = {
  // constants for keys
  Configuration: "configuration",

  MongoDBUser:"dbuser",
  MongoDBPassword:"dbpassword",
  MongoDBHost:"dbhost",
  MongoDBPort:"dbport",
  MongoDBTable:"dbtable",
  NodeServerPort:"node_server_port",
  NodeClusterSize:"node_cluster_size",
  AccessLog:"access_log",
  AccessLogMaxSize:"access_log_max_size",
  MessageLog:"message_log",
  MessageLogMaxSize:"message_log_max_size",

  // relative paths are relative to self.serverRootDir
  bootstrapPaths:["config"],
  bootstrapFiles:["default.json", hostname + ".json"],

  ConfigDebug: "debug",
  ConfigStaging: "staging",
  ConfigProduction: "production",
  ConfigDevelopment: "development",

  // Initializes the config.  ops:
  //   serverRootDir: optional; if missing it will default to
  //     The parent directory of this file's directory.
  //   silent: don't log loading messages
  initialize:function (ops) {
    var self = this;
    if (!ops) {
      ops = {};
    }

    self.ops = ops;

    self.serverRootDir = ops.serverRootDir;
    if (!self.serverRootDir) {
      self.serverRootDir = path.resolve(path.join(__dirname,".."));
    }

    return self.loadConfig();
  },

  pathIsAbsolute: function(path) {
    return path.charAt(0) === "/"
      // windows \path
      || (path.length >= 1 && path.charAt(0) === '\\')
      // windows x:\path
      || (path.length >= 3 && (path.charAt(1) === ":" && (path.charAt(2) === '\\' || path.charAt(2) === '/')));
  },

  // Loads (or reload) the configuration settings
  loadConfig:function () {
    var self = this;

    var loadedSomething = false;

    logger.debug("Loading config", LogCategory);
    currentConfig = {};

    _.each(self.bootstrapFiles, function (file) {
      var filepath = null;
      // try each of the paths
      logger.debug("File: " + file, LogCategory);
      _.each(self.bootstrapPaths, function (fpath) {
        var f;
        // only prepend serverRoot on non-absolute paths
        if (!self.pathIsAbsolute(fpath)) {
          f = path.join(self.serverRootDir, fpath, file);
        } else {
          f = path.join(fpath, file);
        }
        logger.debug("Searching for: " + f, LogCategory);
        if (fs.existsSync(f)) {
          filepath = f;
          return false;
        }
      });

      if (filepath) {
        if (!self.ops.silent) {
          logger.info("Loading configuration from " + filepath, LogCategory);
        }

        var fData = fs.readFileSync(filepath);
        try {
          var jData = JSON.parse(fData);
          currentConfig = _.extend(currentConfig, jData);
          loadedSomething = true;
        } catch (exception) {
          logger.error("FAILED to read config file " + filepath + "; Exception: " + exception, LogCategory);
        }
      } else {
        if (!self.ops.silent) {
          logger.info("No host-specific configuration file found: " + file, LogCategory);
        }
      }
    });

    self.setConfiguration(self.ops.silent);

    return loadedSomething;
  },

  setConfiguration: function(silent) {
    // allow NODE_ENV to override file configuration
    if (process.env.NODE_ENV) {
      if (!silent) {
        logger.info("Setting configuration from NODE_ENV: " + process.env.NODE_ENV, LogCategory);
      }
      this.currentConfiguration = process.env.NODE_ENV.toLowerCase();
    } else {
      var fConfig = this.get(this.Configuration);
      if (fConfig) {
        fConfig = fConfig.toLowerCase();
      }
      if (!silent) {
        logger.info("Setting configuration from file: " + fConfig, LogCategory);
      }
      this.currentConfiguration = fConfig;
    }
  },

  getConfiguration: function() {
    return this.currentConfiguration;
  },

  isDebug: function() {
    return this.currentConfiguration === this.ConfigDebug;
  },

  isDevelopment: function() {
    return this.currentConfiguration === this.ConfigDevelopment;
  },

  isStaging: function() {
    return this.currentConfiguration === this.ConfigStaging;
  },

  isProduction: function() {
    return this.currentConfiguration === this.ConfigProduction;
  },

  // Returns the value of a specified key, or null if no value exists.
  // NOTE: it is preferable to always call get() on the config to obtain a configuration value,
  // rather than calling it once and storing the result in a variable.  This allows the configuration to be
  // reloaded without a server restart.
  get:function (key) {
    try {
      return currentConfig[key];
    } catch (exception) {
      return undefined;
    }
  },

  getMongoDBHost:function() {
    return this.get(this.MongoDBHost) + ":" + this.get(this.MongoDBPort);
  },

  getMongoDBTable:function() {
    return this.get(this.MongoDBTable);
  }
};

exports = module.exports = Config;