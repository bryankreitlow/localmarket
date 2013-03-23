/*jslint node:true, es5:true */
"use strict";
var mongoose = require('mongoose'),
  LocalStrategy = require('passport-local').Strategy,
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
      Contributor.findOne({ email: email }, function (err, contributor) {
        if (err) { return done(err); }
        if (!contributor) {
          return done(null, false, { message: 'Unknown user' });
        }
        if (!contributor.authenticate(password)) {
          return done(null, false, { message: 'Invalid password' });
        }
        return done(null, contributor);
      });
    }
  ));
};