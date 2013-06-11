/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var FoodSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String, enum: ["grown", "made"],
    required: true
  }
});

FoodSchema.plugin(timestamps);

var Food = mongoose.model('Food', FoodSchema);

FoodSchema.methods = {
  listAll: function (options, cb) {
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Food').find().sort(order + sort).exec(cb);
  }
};

module.exports = {
  Name: 'Food',
  Schema: FoodSchema,
  Model: Food,
  Methods: FoodSchema.methods
};