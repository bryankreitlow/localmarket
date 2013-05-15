/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var MarketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String
  },
  city: {
    type: String
  },
  region: {
    type: String,
    required: false
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  location: {
    type: [Number],
    index: '2d'
  },
  website: {
    type: String
  },
  vendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  }]
});

MarketSchema.plugin(timestamps);

var Market = mongoose.model('Market', MarketSchema);

MarketSchema.methods = {
  listAll: function (options, cb) {
    var sort = options.sort;
    var order = (options.order === 'desc') ? '-' : '+';
    return mongoose.model('Market').find().sort(order + sort).exec(cb);
  }
};

module.exports = {
  Model: Market,
  Methods: MarketSchema.methods
};