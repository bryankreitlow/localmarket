/*jslint node:true, es5:true */

var Contributor = require('../models/Contributor').Model;
var listContributors = require('../models/Contributor').Methods.listContributors;
var _ = require('underscore');

module.exports = function(app) {
  "use strict";

  app.get('/accounts', function(req, res){
    listContributors(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        res.render('account/list', {accounts: accounts});
      }
    });
  });

  app.post('/login', function(req, res) {
    console.log(req.body);
    res.end('Test');
  });

  app.get('/account/info/:email', function(req, res){
    Contributor.find({email: req.params.email}).exec(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        res.end(JSON.stringify(accounts));
      }
    });
  });

  app.get('/account/signup', function(req, res){
    res.render('account/signup');
  });

  app.post('/account/signup', function(req, res) {
    var reqBody = req.body;
    var contributor = new Contributor({ name: { first: reqBody.first, last: reqBody.last }, email: reqBody.email, password: reqBody.password});
    // Check if account already exists
    Contributor.find({ email: reqBody.email }).exec(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        // No Account Found
        if(!accounts.length) {
          contributor.save(function(err, contributor) {
            if(err) {
              res.writeln('test');
              res.end('Failed to Create Account');
              console.log(err);
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