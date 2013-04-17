/*jslint node:true, es5:true */

var Entry = require('../../models/Entry').Model;
var Market = require('../../models/Market').Model;
var listEntries = require('../../models/Entry').Methods.listEntries;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

var enums = Entry.schema.path("type").enumValues;

module.exports = function(app, sharedContext, passport, auth) {
  "use strict";

  app.get('/entries', function(req, res){
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    listEntries(sortOptions, function(err, entries) {
      if(err) {
        res.send(404);
      } else {
        res.render('entry/list', buildPageContext(req,{entries: entries, sortOptions: sortOptions}, sharedContext));
      }
    });
  });

  app.get('/entry/add', auth.requiresLogin, function (req, res) {
    res.render('entry/AddEntry', buildPageContext(req, {user: req.user, entryTypes: enums}, sharedContext));
  });

  app.post('/entry/add', auth.requiresLogin, function(req, res){
    console.log(req.body);
    var reqBody = req.body, type = reqBody.type;
    var message;
    var completed = function(err) {
      if(err) {
        message = err;
      } else {
        message = type + " Added.";
      }
      res.render('entry/AddEntry', buildPageContext(req, {user: req.user, message: message, entryTypes: enums}, sharedContext));
    };
    switch(type) {
      case "Market":
        var market = new Market({
          name: reqBody.name,
          displayName: reqBody.name,
          addressLine1: reqBody.addressLine1,
          addressLine2: reqBody.addressLine2,
          city: reqBody.city,
          region: reqBody.region,
          postalCode: reqBody.postalCode,
          country: reqBody.country
        });
        market.save(function(err) {
          if(err) {
            completed(err);
          } else {
            var entry = new Entry({ type: type, _contributor: req.user._id, market: market._id });
            entry.save(function(err) {
              if(err) {
                completed(err);
              } else {
                completed(err);
              }
            });
          }
        });
        break;
      case "Recipe":
        completed("Type " + type + " Not Yet Defined");
        break;
      case "Event":
        completed("Type " + type + " Not Yet Defined");
        break;
      default:
        completed("Cannot Process Request, No Definition for Type " + type);
    }
  });

  app.get('/entry/:id', function(req, res) {
    Entry.findById(req.params.id).select("title type").exec(function(err, entry) {
      if(err) {
        return res.send(404);
      }
      return res.render('entry/viewEntry', buildPageContext(req, {entry: entry}, sharedContext));
    });
  });

};