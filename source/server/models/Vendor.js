/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose);

var Url = mongoose.SchemaTypes.Url;

var timestamps = require('mongoose-timestamp');

var VendorSchema = new mongoose.Schema({
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
  description: {
    type: String
  },
  website:{
    type: Url
  },
  phoneNumber:{
    type: String,
    trim: true
  },
  _foods: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      index: true
    }
  ],
  _markets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      index: true
    }
  ]
});

VendorSchema.plugin(timestamps);

var Vendor = mongoose.model('Vendor', VendorSchema);

VendorSchema.methods = {
  listAll: function (options, cb) {
    var sort = options.sort;
    var order = (options.order === 'desc') ? '-' : '+';
    return mongoose.model('Vendor').find().sort(order + sort).exec(cb);
  }
};

module.exports = {
  Model: Vendor,
  Methods: VendorSchema.methods
};