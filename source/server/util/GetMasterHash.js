/*jslint node:true, es5:true */
"use strict";

// Used for cachebusting by appending the current hash of the master branch to the built assets
var logger = require("./Logger");
var exec = require('child_process').exec;
var LogCategory = "Get Master Hash";

module.exports = function(callback) {
  logger.info("Fetching master branch hash for cache busting", LogCategory);
  exec("git ls-remote git://github.com/bryankreitlow/localmarket.git HEAD | cut -c 1-40", function(error, stdout, stderr) {
    callback(error, stdout);
  });
};