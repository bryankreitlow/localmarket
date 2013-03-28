/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var mongooseTypes = require("mongoose-types");
var bcrypt = require('bcrypt'),
  SALT_WORK_FACTOR = 10,
// Account lock mechanism for failed logins
  MAX_LOGIN_ATTEMPTS = 5,
  LOCK_TIME = 2 * 60 * 60 * 1000;
mongooseTypes.loadTypes(mongoose);

var Email = mongoose.SchemaTypes.Email;

var ContributorSchema = new mongoose.Schema({
  email: {
    type: Email,
    index: {unique: true},
    required: true
  },
  capability: { // [user, moderator, admin]
    type: String, enum : ["user", "moderator", "admin"],
    default: "user"
  },
  password: {
    type: String,
    required: true
  },
  color: {
    type: String
  },
  loginAttempts: { type: Number, required: true, default: 0 }, //store consecutive login failures
  lockUntil: { type: Number }, // store a lock timestamp if too many failures
  name: {
    first: String,
    last: String
  },
  preferences: {
    type: mongoose.Schema.Types.Mixed
  },
  entries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entry',
    index: true
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor'
  }],
  location: {
    type: [Number],
    index: '2d'
  },
  creationDate: {
    type: Date
  }
});
// Enum on model to manage failed login reasons
var reasons = ContributorSchema.statics.failedLogin = {
  NOT_FOUND: 0,
  PASSWORD_INCORRECT: 1,
  MAX_ATTEMPTS: 2
};
// Check for a future lockUntil timestamp
ContributorSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});
// Salt and encrypt the password
ContributorSchema.pre('save', function(next) {
  var contributor = this;
  // Only hash if new/modified password
  if(!contributor.isModified('password')) {
    return next();
  }
  // Generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if(err) {
      return next(err);
    }
    // hash the password using our new salt
    bcrypt.hash(contributor.password, salt, function(err, hash) {
      if(err) {
        return next(err);
      }
      // Replace cleartext pass with hashed password
      contributor.password = hash;
      next();
    });
  });
});

ContributorSchema.plugin(timestamps);

ContributorSchema.methods = {
  comparePassword: function (candidatePass, cb) {
    var self = this;
    bcrypt.compare(candidatePass, self.password, function (err, isMatch) {
      if (err) {
        cb(err);
      }
      cb(null, isMatch);
    });
  },
  isModerator: function () {
    return this.capability === "moderator" || this.capability === "admin";
  },
  isAdmin: function () {
    return this.capability === "admin";
  },
  incLoginAttempts: function (cb) {
    // If previously expired lock restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
      return this.update({
        $set: {loginAttempts: 1},
        $unset: {lockUntil: 1}
      }, cb);
    }
    // Otherwise time to increment failed attempts
    var updates = { $inc: { loginAttempts: 1 }};
    // Lock the account if max number reached and not already locked
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
      updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }
    return this.update(updates, cb);
  },
  fullName: function () {
    return this.name.first + ' ' + this.name.last;
  },
  setLocation: function (locArray, cb) {
    var updates = { $set: {location: locArray}};
    return this.update(updates, cb);
  }
};
ContributorSchema.statics.getAuthenticated = function(email, password, cb) {
  this.findOne({ email: email}, function(err, contributor) {
    if(err) {
      return cb(err);
    }
    // Make sure Contributor exists
    if(!contributor) {
      return cb(null, null, reasons.NOT_FOUND);
    }
    // Check account lock
    if(contributor.isLocked) {
      // Increment attempts if account locked
      return contributor.incLoginAttempts(function(err) {
        if(err) {
          return cb(err);
        }
        return cb(null, null, reasons.MAX_ATTEMPTS);
      });
    }
    // Test password
    contributor.comparePassword(password, function(err, isMatch) {
      if(err) {
        return cb(err);
      }
      // Check if password was a match
      if(isMatch) {
        if(!contributor.loginAttempts && !contributor.lockUntil) {
          return cb(null, contributor);
        }
        // Reset attempts and lock
        var updates = {
          $set: {loginAttempts: 0},
          $unset: {lockUntil: 1}
        };
        return contributor.update(updates, function(err) {
          if(err) {
            return cb(err);
          }
          return cb(null, contributor);
        });
      }
      // Password incorrect, increment attempts
      contributor.incLoginAttempts(function(err) {
        if(err) {
          return cb(err);
        }
        return cb(null, null, reasons.PASSWORD_INCORRECT);
      });
    });
  });
};

mongoose.model('Contributor', ContributorSchema);

var listContributors = ContributorSchema.methods.listContributors = function (options, cb) {
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Contributor').find().sort(order + sort).select("name location creationDate capability color").exec(cb);
};

module.exports = {
  Model: mongoose.model('Contributor'),
  Methods: {
    listContributors: listContributors
  }
};