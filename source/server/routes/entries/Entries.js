/*jslint node:true, es5:true */

var Entry = require('../../models/Entry').Model;
var geocode = require('../../util/Geocode').geocodeAddress;
var Market = require('../../models/Market').Model;
var marketMethods = require('../../models/Market').Methods;
var listEntries = require('../../models/Entry').Methods.listEntries;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

var enums = Entry.schema.path("type").enumValues;

var getAddress = function(market) {
  "use strict";
  var address = [];
  address.push(market.addressLine1, market.addressLine2, market.city, market.region, market.postalCode, market.country);
  return address.join(' ');
}

module.exports = function(app, sharedContext, passport, auth) {
  "use strict";

  app.get('/entries', function(req, res, next){
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    listEntries(sortOptions, function(err, entries) {
      if(err) {
        next(err);
      } else {
        res.render('entry/list', buildPageContext(req,{entries: entries, sortOptions: sortOptions}, sharedContext));
      }
    });
  });

  app.get('/entry/add', auth.requiresLogin, function (req, res) {
    res.render('entry/AddEntry', buildPageContext(req, {user: req.user, entryTypes: enums}, sharedContext));
  });

  app.post('/entry/add', auth.requiresLogin, function(req, res, next){
    var reqBody = req.body, type = reqBody.type;
    var message;
    var completed = function(err) {
      if(err) {
        next(err);
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
        geocode(getAddress(market), function(err, body) {
          if(err) { //If error geocoding continue
          } else { //Set lat lng from address
            //console.log(body.results[0].address_components);
            if(body.results[0] && body.results[0].geometry && body.results[0].geometry.location) {
              var location = body.results[0].geometry.location;
              var locArray = [location.lng, location.lat];
              market.location = locArray;
            } else {
              console.log('No Location Derived for Market ' + reqBody.name);
            }
          }
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

  app.get('/market/:id', function(req, res, next) {
    Entry.findById(req.params.id).populate('market').exec(function(err, entry) {
      var location = (entry.market.location[0]) ? entry.market.location : [null, null];
      if(err) {
        next(err);
      }
      return res.render('entry/viewMarket', buildPageContext(req, {entry: entry, lat: location[1], long: location[0]}, sharedContext));
    });
  });

  app.get('/entry/:id', function(req, res, next) {
    Entry.findById(req.params.id).select("title type").exec(function(err, entry) {
      if(err) {
        next(err);
      }
      return res.render('entry/viewEntry', buildPageContext(req, {entry: entry}, sharedContext));
    });
  });

};