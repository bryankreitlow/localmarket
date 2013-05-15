/*jslint node:true, es5:true */

var Contributor = require('../../models/Contributor').Model;
var listContributors = require('../../models/Contributor').Methods.listContributors;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

module.exports = function(app, sharedContext, passport, auth) {
  "use strict";

  app.get('/accounts', auth.requiresAdmin, function(req, res, next){
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    listContributors(sortOptions, function(err, accounts) {
      if(err) {
        next(err);
      } else {
        res.render('account/list', buildPageContext(req,{accounts: accounts, sortOptions: sortOptions}, sharedContext));
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

  app.get('/contributor/:id', function(req, res, next) {
    Contributor.findById(req.params.id).select("name creationDate color entries followers following capability").exec(function(err, contributor) {
      if(err) {
        next(err);
      }
      return res.render('account/publicProfile', buildPageContext(req, {contributor: contributor}, sharedContext));
    });
  });

  app.post('/account/updateLocation', function(req, res, next){
    var body = req.body;
    if(req.user) {
      req.user.setLocation([body.long, body.lat], function(err) {
        if(err) {
          next(err);
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

  app.post('/account/signup', function(req, res, next) {
    var reqBody = req.body;
    var contributor = new Contributor({ name: { first: reqBody.first, last: reqBody.last }, email: reqBody.email, password: reqBody.password, color: reqBody.color, creationDate: new Date()});
    // Check if account already exists
    Contributor.find({ email: reqBody.email }).exec(function(err, accounts) {
      if(err) {
        next(err);
      } else {
        // No Account Found
        if(!accounts.length) {
          contributor.save(function(err, contributor) {
            if(err) {
              next(err);
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