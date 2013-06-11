/*jslint node:true, es5:true */
"use strict";

var _ = require('underscore');
var config = require('../util/Config');
var logger = require("../util/Logger");
var fs = require('fs');
var mongoose = require('mongoose');

var LogCategory = 'Register Models';

var getModelPaths = function(path) {
  var paths = [];
  var traverseFileSystem = function (currentPath) {
    var files = fs.readdirSync(currentPath);
    for (var i in files) {
      if (files.hasOwnProperty(i)) {
        var currentFile = currentPath + '/' + files[i];
        var stats = fs.statSync(currentFile);
        if (stats.isFile() && (/\.(js)$/i).test(currentFile) && currentFile !== __filename) {
          paths.push(currentFile);
        } else if (stats.isDirectory()) {
          traverseFileSystem(currentFile);
        }
      }
    }
  };
  traverseFileSystem(path);
  return paths;
};

var models = getModelPaths(__dirname);

module.exports = function() {
  // Hook up the models contained in the subdirs within models
  _.forEach(models, function(model) {
    var ModelName = require(model).Name;
    var ModelSchema = require(model).Schema;
    mongoose.model(ModelName, ModelSchema);
    logger.info('Registering ' + ModelName + ' Model', LogCategory);
  });
};