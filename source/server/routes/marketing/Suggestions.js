/*jslint node:true, es5:true */

var Suggestion = require('../../models/Suggestion').Model;
var listSuggestions = require('../../models/Suggestion').Methods.listSuggestions;
var _ = require('underscore');

module.exports = function(app, buildPageContext, passport, auth) {
  "use strict";

  app.get('/suggestions', function(req, res, next){
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    if(!sortOptions.sort) {
      sortOptions.sort = 'creationDate';
    }
    listSuggestions(sortOptions, function(err, suggestions) {
      if(err) {
        next(err);
      } else {
        res.render('suggestions/list', buildPageContext(req, {suggestions: suggestions, user: req.user}));
      }
    });
  });

  app.post('/suggestion', auth.requiresLogin, function(req, res, next) {
    var reqBody = req.body;
    var suggestion = new Suggestion({ title: reqBody.title, _contributor: req.user._id, description: reqBody.description, creationDate: new Date()});
    // Save new suggestion
    suggestion.save(function(err, suggestion) {
      if(err) {
        next(err);
      } else {
        res.end('Suggestion added, thank you ' + req.user.name.first + '.');
      }
    });
  });

  app.get('/suggestion', auth.requiresLogin, function(req, res) {
    res.render('suggestions/addSuggestion', buildPageContext(req, {user: req.user}));
  });

};