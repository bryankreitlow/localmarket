/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var CommentSchema = new mongoose.Schema({
  _contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
    index: true
  },	
  comment: {
    type: String,
    unique: true,
    required: true,
    trim: true
  }
});

CommentSchema.plugin(timestamps);

var Comment = mongoose.model('Comment', CommentSchema);

CommentSchema.methods = {
  listAll: function (options, cb) {
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Comment').find().sort(order + sort).exec(cb);
  }
};

module.exports = {
  Name: 'Comment',
  Schema: CommentSchema,
  Model: Comment,
  Methods: CommentSchema.methods
};