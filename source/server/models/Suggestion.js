/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var SuggestionSchema = new mongoose.Schema({
  _contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor'
  },
  title: {
    type: String,
    index: true,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  creationDate: {
    type: Date
  }
});

var listSuggestions = SuggestionSchema.methods.listSuggestions = function (options, cb) {
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Suggestion').find().populate('_contributor', 'name').sort(order + sort).select("title description creationDate _contributor").exec(cb);
};

SuggestionSchema.plugin(timestamps);

mongoose.model('Suggestion', SuggestionSchema);

module.exports = {
  Name: 'Suggestion',
  Schema: SuggestionSchema,
  Model: mongoose.model('Suggestion'),
  Methods: {
    listSuggestions: listSuggestions
  }
};