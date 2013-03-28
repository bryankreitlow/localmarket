/*jslint node:true, es5:true */
"use strict";

var config = require('./Config');
var logger = require("./Logger");
var mongoose = require('mongoose');
mongoose.set('debug', true);
var LogCategory = "Mongo";

var Mongo = {
  initialize: function(callback) {
    var self = this;
    logger.debug("Initializing Database Connection", LogCategory);
    mongoose.connect(config.getMongoDBConnectionString());
    var db = self.db = mongoose.connection;
    db.on('error', function(error) {
      console.log('db connect error');
      callback(error, null);
    });
    db.on('connected', function() {
      callback(true, db);
    });
    db.on('disconnected', function() {
      console.log('Disconnected from the MongoDB database');
    });
  }
};

exports = module.exports = Mongo;