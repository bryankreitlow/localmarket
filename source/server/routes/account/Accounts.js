/*jslint node:true, es5:true */

var Contributor = require('../../models/Contributor').Model;
var listContributors = require('../../models/Contributor').Methods.listContributors;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

module.exports = function(app, sharedContext, passport, auth) {
  "use strict";

  app.get('/accounts', function(req, res){
    var query = req.query;
    console.log(query);
    listContributors(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        res.render('account/list', buildPageContext(req,{accounts: accounts}, sharedContext));
      }
    });
  });

  app.get('/login', function(req, res) {
    res.render('account/login', buildPageContext(req, req.flash(), sharedContext));
  });

  app.post('/login', passport.authenticate('local', {failureRedirect: '/login', failureFlash: true, successFlash: 'Welcome!'}), function(req, res) {
    // Remember me set, keep the session alive for 30 days!
    if(req.body.rememberme) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }
    res.redirect('/profile');
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/profile', auth.requiresLogin, function(req, res) {
    res.render('account/profile', buildPageContext(req, {user: req.user}, sharedContext));
  });

  app.post('/account/updateLocation', function(req, res){
    var body = req.body;
    if(req.user) {
      req.user.setLocation([body.lat, body.long], function(err) {
        if(err) {
          res.send(404);
        }
        res.send(200);
      });
    } else {
      req.session.location = {lat: body.lat, long: body.long};
      res.send(200);
    }
  });

  app.get('/account/signup', function(req, res){
    res.render('account/signup', buildPageContext(req, sharedContext));
  });

  app.post('/account/signup', function(req, res) {
    var reqBody = req.body;
    console.log(reqBody);
    var contributor = new Contributor({ name: { first: reqBody.first, last: reqBody.last }, email: reqBody.email, password: reqBody.password, color: reqBody.color});
    // Check if account already exists
    Contributor.find({ email: reqBody.email }).exec(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        // No Account Found
        if(!accounts.length) {
          contributor.save(function(err, contributor) {
            if(err) {
              res.end('Failed to Create Account');
            } else {
              res.end('Account added for ' + contributor.name.first);
            }
          });
        } else {
          res.end('Account already exists, did you forget your password?');
        }
      }
    });
  });
};