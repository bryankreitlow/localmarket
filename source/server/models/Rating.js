/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var RatingSchema = new mongoose.Schema({
  _contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    index: true
  },	
  rate: {
    type: Number,
    required: true
  }
});

RatingSchema.plugin(timestamps);

var Rating = mongoose.model('Rating', RatingSchema);

RatingSchema.methods = {
  listAll: function (options, cb) {
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Rating').find().sort(order + sort).exec(cb);
  }
};

module.exports = {
  Name: 'Rating',
  Schema: RatingSchema,
  Model: Rating,
  Methods: RatingSchema.methods
};