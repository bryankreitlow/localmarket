/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var EntrySchema = new mongoose.Schema({
  _contributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
    index: true
  },
  type: {
    type: String, enum: ['Recipe', 'Market', 'Event', 'Vendor'],
    index: true,
    required: true
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  market: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }
});

EntrySchema.plugin(timestamps);

mongoose.model('Entry', EntrySchema);

var listEntries = EntrySchema.methods.listEntries = function (options, cb) {
  var type = options.type;
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Entry').find().populate('_contributor', 'name').sort(order + sort).select("title type _contributor").exec(cb);
};

var listEntriesInRadius = EntrySchema.methods.listEntriesInRadius = function (options, cb) {
  var entryType = options.entryType;
  var radius = options.radius / 3963.192;
  //convert radius distance from miles to radians by dividing miles by the radius of earth 3963.192 miles
  var currentlocation = options.location;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Entry').find({type: entryType}).populate(entryType.toLowerCase(),null,{location: {
    $nearSphere: [currentlocation.long, currentlocation.lat], $maxDistance: radius
  }}).exec(cb);
};


module.exports = {
  Model: mongoose.model('Entry'),
  Methods: {
    listEntries: listEntries,
    listEntriesInRadius: listEntriesInRadius
  }
};