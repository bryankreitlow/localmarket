/*jslint node:true, es5:true */

var Contributor = require('../models/Contributor');

module.exports = function(app) {
  "use strict";

  app.get('/accounts', function(req, res){
    Contributor.find().exec(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        res.end(JSON.stringify(accounts));
      }
    });
  });

  app.post('/account', function(req, res) {
    console.log(req.body);
    res.end('Test');
  });

  app.post('/login', function(req, res) {
    console.log(req.body);
    res.end('Test');
  });

  app.get('/account/:email', function(req, res){
    Contributor.find({email: req.params.email}).exec(function(err, accounts) {
      if(err) {
        res.send(404);
      } else {
        res.end(JSON.stringify(accounts));
      }
    });
  });

  app.get('/user/add/:newUserName', function(req, res){
    var user = new User({ name: req.params.newUserName });
    user.save(function(err, user) {
      if(err) {
        res.end('Failure');
      } else {
        res.end('User ' + user.name + ' Added');
      }
    });

  });

};