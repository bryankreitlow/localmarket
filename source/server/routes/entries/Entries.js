/*jslint node:true, es5:true */

var Entry = require('../../models/Entry').Model;
var geocode = require('../../util/Geocode').geocodeAddress;
var Market = require('../../models/Market').Model;
var Vendor = require('../../models/Vendor').Model;
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
        res.render('entry/AddEntry', buildPageContext(req, {user: req.user, message: message, entryTypes: enums}, sharedContext));
      }
    };
    switch(type) {
      case "Market":
        var market = new Market({
          name: reqBody.name,
          displayName: reqBody.name,
          website: reqBody.website,
          addressLine1: reqBody.addressLine1,
          addressLine2: reqBody.addressLine2,
          city: reqBody.city,
          region: reqBody.region,
          postalCode: reqBody.postalCode,
          country: reqBody.country
        });
        geocode(getAddress(market), function(err, body) {
          if(err) { //If error geocoding continue
            console.log('Error Geocoding Address: ' + getAddress(market));
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
        completed(new Error("Type " + type + " Not Yet Supported"));
        break;
      case "Vendor":
        completed(new Error("Type " + type + " Not Yet Supported"));
        break;
      case "Event":
        completed(new Error("Type " + type + " Not Yet Supported"));
        break;
      default:
        completed(new Error("Cannot Process Request, No Definition for Type " + type));
    }
  });

  app.get('/vendor/:id/add', auth.requiresLogin, function(req, res, next) {
      Entry.findById(req.params.id).populate('market').exec(function(err, entry) {
        if(err) {
          next(err);
        }
        if(!entry) {
          next();
        } else if(entry && entry.type !== "Market") {
          next(new Error('A Vendor Can Only be Added to a Market'));
        } else {
          var location = (entry && entry.market && entry.market.location[0]) ? entry.market.location : [null, null];
          return res.render('entry/addVendor', buildPageContext(req, {entry: entry, lat: location[1], long: location[0]}, sharedContext));
        }
      });
  });

  app.post('/vendor/:id/add', auth.requiresLogin, function(req, res, next) {
    var reqBody = req.body;
    Entry.findById(req.params.id).populate('market').populate('market.vendors').exec(function(err, entry) {
      if(err) {
        next(err);
      }
      if(!entry) {
        next();
      } else if(entry && entry.type !== "Market") {
        next(new Error('A Vendor Can Only be Added to a Market'));
      } else {
        var vendor = new Vendor({
          name: reqBody.name,
          displayName: reqBody.name,
          website: reqBody.website,
          description: reqBody.description,
          phoneNumber: reqBody.phoneNumber,
          _markets: [
            entry.market._id
          ]
        });
        vendor.save(function(err) {
          if(err) {
            next(err);
          } else {
            entry.market._vendors.push(vendor._id);
            entry.market.save(function(err) {
              if(err) {
                next(err);
              } else {
                var newentry = new Entry({ type: 'Vendor', _contributor: req.user._id, vendor: vendor._id });
                newentry.save(function(err) {
                  if(err) {
                    next(err);
                  } else {
                    var location = (entry && entry.market && entry.market.location[0]) ? entry.market.location : [null, null];
                    return res.render('entry/addVendor', buildPageContext(req, {entry: entry, message: 'Vendor ' + vendor.displayName + ' Added.', lat: location[1], long: location[0]}, sharedContext));
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  app.get('/market/:id', function(req, res, next) {
    Entry.findById(req.params.id).populate('market').populate('market._vendors', ["name"]).exec(function(err, entry) {
      if(err) {
        next(err);
      }
      if(!entry) {
        next();
      } else if(entry && entry.type !== "Market") {
        next();
      } else {
        Vendor.populate(entry.market,{
          path: '_vendors',
          select: 'displayName description'
        }, function(err) {
          if(err) {
            next(err);
          } else {
            var location = (entry.market.location[0]) ? entry.market.location : [null, null];
            return res.render('entry/viewMarket', buildPageContext(req, {entry: entry, lat: location[1], long: location[0]}, sharedContext));
          }
        });
      }
    });
  });

  app.get('/entry/:id', function(req, res, next) {
    Entry.findById(req.params.id).select("title type").exec(function(err, entry) {
      if(err) {
        next(err);
      }
      if(!entry) {
        next();
      } else {
        return res.render('entry/viewEntry', buildPageContext(req, {entry: entry}, sharedContext));
      }
    });
  });

};