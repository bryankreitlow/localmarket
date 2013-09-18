/*jslint node:true, es5:true */
"use strict";

var config = require('./Config');
var logger = require("./Logger");
var mongoose = require('mongoose');
mongoose.set('debug', (process.env.NODE_ENV === "production") ? false : false);
var LogCategory = "Mongo";

var Mongo = {
  initialize: function(callback) {
    var self = this;
    logger.debug("Initializing Database Connection", LogCategory);
    mongoose.connect(config.getMongoDBConnectionString());
    var db = self.db = mongoose.connection;
    db.on('error', function(error) {
      console.log(error);
      logger.error('Database Connection Error', LogCategory);
      callback(error, null);
    });
    db.on('connected', function() {
      callback(true, db);
    });
    db.on('disconnected', function() {
      logger.warning('Disconnected from the MongoDB database', LogCategory);
    });
  }
};

exports = module.exports = Mongo;