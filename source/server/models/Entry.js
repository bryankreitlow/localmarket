/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var EntrySchema = new mongoose.Schema({
  _contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor'
  },
  type: {
    type: String, enum: ['Recipe', 'Market', 'Event'],
    index: true,
    required: true
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }
//  market: {
//    type: mongoose.Schema.Types.ObjectId,
//    ref: 'Market'
//  },
//  event: {
//    type: mongoose.Schema.Types.ObjectId,
//    ref: 'Event'
//  }
});

EntrySchema.plugin(timestamps);

mongoose.model('Entry', EntrySchema);

var listEntries = EntrySchema.methods.listEntries = function (options, cb) {
  var type = options.type;
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Entry').find().populate('_contributor', 'name').sort(order + sort).select("title type _contributor").exec(cb);
};


module.exports = {
  Model: mongoose.model('Entry'),
  Methods: {
    listEntries: listEntries
  }
};