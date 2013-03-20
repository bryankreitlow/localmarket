/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose);

var Email = mongoose.SchemaTypes.Email;

var ContributorSchema = new mongoose.Schema({
  email: {
    type: Email,
    index: true,
    required: true
  },
  capability: { // [user, moderator, admin]
    type: String,
    default: "user"
  },
  password: {
    type: String,
    required: true
  },
  name: {
    first: String,
    last: String
  },
  dateCreated: {
    type: Date
  },
  dateModified: {
    type: Date
  },
  location: {
    type: [Number],
    index: '2d'
  }
});

mongoose.model('Contributor', ContributorSchema);

module.exports = mongoose.model('Contributor');