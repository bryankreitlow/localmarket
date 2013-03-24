/*jslint node:true, es5:true */
"use strict";
var mongoose = require('mongoose'),
  LocalStrategy = require('passport-local').Strategy,
  bcrypt = require('bcrypt'),
  Contributor = mongoose.model('Contributor');

module.exports = function(passport) {
  // serialize sessions
  passport.serializeUser(function(contributor, done) {
    done(null, contributor.id);
  });

  passport.deserializeUser(function(id, done) {
    Contributor.findOne({ _id: id }, function (err, contributor) {
      done(err, contributor);
    });
  });

  // use a local strategy
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      Contributor.getAuthenticated(email, password, function(err, contributor, reason) {
        if(err) {
          return done(err);
        }
        if(contributor) {
          return done(null, contributor);
        }
        if(reason === 2) {
          return done(null, false, { message: 'Account Locked Too Many Failed Attempts.' });
        } else {
          return done(null, false, { message: 'Invalid email or password.' });
        }
      });
    }
  ));
};