/*jslint node:true, es5:true */
"use strict";

var config = require('./Config');
var logger = require("./Logger");
var mongoose = require('mongoose');
var LogCategory = "Mongo";

var Mongo = {
  initialize: function(callback) {
    var self = this;
    logger.debug("Initializing Database Connection", LogCategory);
    mongoose.connect(config.getMongoDBConnectionString());
    var db = self.db = mongoose.connection;
    db.on('error', function(error) {
      callback(error, null);
    });
    db.on('open', function() {
      callback(true, self.db);
    });
  }
};

exports = module.exports = Mongo;