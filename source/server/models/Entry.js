/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var EntrySchema = new mongoose.Schema({
  _contributor: {
    type: ObjectId,
    ref: 'Contributor'
  },
  name: {
    type: String,
    index: true
  }
});

EntrySchema.plugin(timestamps);

mongoose.model('Entry', EntrySchema);

module.exports = mongoose.model('Entry');