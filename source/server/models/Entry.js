/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var EntrySchema = new mongoose.Schema({
  name: {
    type: String,
    index: true
  }
});

mongoose.model('Entry', EntrySchema);

module.exports = mongoose.model('Entry');