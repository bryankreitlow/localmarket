/*jslint node:true, es5:true */

var Entry = require('../../models/Entry').Model;
var Market = require('../../models/Market').Model;
var Food = require('../../models/Food').Model;
var _ = require('underscore');

module.exports = function (app, buildPageContext, passport, auth) {
  "use strict";

  app.get('/vendor/:id', function (req, res, next) {
    console.log('test');
    Entry.findById(req.params.id).populate('vendor').exec(function(err, entry) {
      if(err) {
        next(err);
      }
      Market.populate(entry.vendor, {
        path: '_markets',
        select: 'displayName description'
      }, function(err) {
        if(err) {
          next(err);
        } else {
          Food.populate(entry.vendor, {
            path: '_foods',
            select: 'name type'
          }, function(err) {
            if(err) {
              next(err);
            } else {
              console.log(entry.vendor);
              res.render('entry/viewVendor', buildPageContext(req, {entry: entry}));
            }
          });
        }
      });
    });
  });

};