/*jslint node:true, es5:true */

var Food = require('../../models/Food').Model;
var listFoods = require('../../models/Food').Methods.listAll;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

var enums = Food.schema.path("type").enumValues;

module.exports = function (app, sharedContext, passport, auth) {
  "use strict";

  app.post('/food/add', auth.requiresModerator, function (req, res) {
    var reqBody = req.body;
    var food = new Food({ name: reqBody.name, type : reqBody.type});
    // Save new suggestion
    food.save(function (err, food) {
      var message;
      if (err) {
        message = 'Failed to Save Food ' + reqBody.name;
      } else {
        message = 'Food ' + food.name + ' added, thank you ' + req.user.name.first + '.';
      }
      res.render('food/AddFood', buildPageContext(req, {user: req.user, message: message, foodTypes: enums}, sharedContext));
    });
  });

  app.get('/food/add', auth.requiresModerator, function (req, res) {
    res.render('food/AddFood', buildPageContext(req, {user: req.user, foodTypes: enums}, sharedContext));
  });

  app.get('/foods', function (req, res) {
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    listFoods(sortOptions, function(err, foods) {
      if(err) {
        res.send(500);
      } else {
        res.render('food/ListFoods', buildPageContext(req,{foods: foods, sortOptions: sortOptions}, sharedContext));
      }
    });
  });

};