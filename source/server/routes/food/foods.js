/*jslint node:true, es5:true */

var Food = require('../../models/Food').Model;
var listFoods = require('../../models/Food').Methods.listAll;
var _ = require('underscore');

var enums = Food.schema.path("type").enumValues;

module.exports = function (app, buildPageContext, passport, auth) {
  "use strict";

  app.post('/food/add', auth.requiresModerator, function (req, res, next) {
    var reqBody = req.body;
    var food = new Food({ name: reqBody.name, type : reqBody.type});
    // Save new suggestion
    food.save(function (err) {
      var message;
      if (err) {
        next(err);
      } else {
        message = 'Food ' + food.name + ' added, thank you ' + req.user.name.first + '.';
      }
      res.render('food/AddFood', buildPageContext(req, {user: req.user, message: message, foodTypes: enums}));
    });
  });

  app.get('/food/add', auth.requiresModerator, function (req, res) {
    res.render('food/AddFood', buildPageContext(req, {user: req.user, foodTypes: enums}));
  });

  app.get('/foods', function (req, res, next) {
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    listFoods(sortOptions, function(err, foods) {
      if(err) {
        next(err);
      } else {
        res.render('food/ListFoods', buildPageContext(req,{foods: foods, sortOptions: sortOptions}));
      }
    });
  });

};