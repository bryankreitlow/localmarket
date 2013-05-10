/*jslint node:true, es5:true */

var Food = require('../../models/Food').Model;
var listEntriesInRadius = require('../../models/Entry').Methods.listEntriesInRadius;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

module.exports = function (app, sharedContext, passport, auth) {
  "use strict";

  app.get('/marketfinder', function (req, res) {
    var location;
    var markets;
    if(req.user && req.user.location) {
      location = (req.user.location[0]) ? {lat: req.user.location[1], long: req.user.location[0]} : {lat: "false", long: "false"};
    } else {
      location = (req.session.location) ? (req.session.location) : {lat: "false", long: "false"};
    }
    listEntriesInRadius({entryType: 'Market', location: location, radius: 25}, function(err, entries) {
      if(err) {
        markets = [];
      } else {
        markets = _.filter(entries, function(entry) {
          return entry.market !== null;
        });
        var marketLocations = [];
        _.forEach(markets, function(market) {
          marketLocations.push({name: market.market.displayName, id: market._id, long: market.market.location[0], lat: market.market.location[1]});
        });
        res.render('marketfinder/marketfinder', buildPageContext(req,{location: location, entries: markets, marketLocations: JSON.stringify(marketLocations)}, sharedContext));
      }
    });
  });
};