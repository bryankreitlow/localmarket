/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  dateModified: {
    type: Date
  },
  userLocation: {
    type: [Number],
    index: '2d'
  }
});

mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');