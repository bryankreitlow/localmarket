/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose);

var Url = mongoose.SchemaTypes.Url;

var timestamps = require('mongoose-timestamp');

var MarketVendorSchema = new mongoose.Schema({
  noShowDates: [{
    dateUnavailable: {
      type: Date
    },
    reason: {
      type: String,
      'default': 'Unavailable'
    }
  }],
  _vendorEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
      index: true
  },
  _marketEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
      index: true
  }
});

MarketVendorSchema.plugin(timestamps);

var Vendor = mongoose.model('MarketVendor', MarketVendorSchema);

MarketVendorSchema.methods = {
  listAll: function (options, cb) {
    var sort = options.sort;
    var order = (options.order === 'desc') ? '-' : '+';
    return mongoose.model('MarketVendor').find().sort(order + sort).exec(cb);
  }
};

module.exports = {
  Name: 'MarketVendor',
  Schema: MarketVendorSchema,
  Model: Vendor,
  Methods: MarketVendorSchema.methods
};