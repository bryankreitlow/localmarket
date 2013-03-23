/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose);

var Email = mongoose.SchemaTypes.Email;

var ContributorSchema = new mongoose.Schema({
  email: {
    type: Email,
    index: true,
    required: true,
    unique: true
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
  preferences: {
    type: mongoose.Schema.Types.Mixed
  },
  entries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entry'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor'
  }],
  location: {
    type: [Number],
    index: '2d'
  }
});

ContributorSchema.plugin(timestamps);

ContributorSchema.methods = {
  authenticate: function(plainText) {
    return plainText === this.password;
  },
  fullName: function() {
    return this.name.first + ' ' + this.name.last;
  }
};

var listContributors = ContributorSchema.methods.listContributors = function (cb) {
  return mongoose.model('Contributor').find().select("name location createdAt capability").exec(cb);
};

mongoose.model('Contributor', ContributorSchema);

module.exports = {
  Model: mongoose.model('Contributor'),
  Methods: {
    listContributors: listContributors
  }
};