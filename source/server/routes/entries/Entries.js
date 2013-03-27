/*jslint node:true, es5:true */

var Entry = require('../../models/Entry').Model;
var listEntries = require('../../models/Entry').Methods.listEntries;
var buildPageContext = require('../utils/ContextUtil').buildPageContext;
var _ = require('underscore');

module.exports = function(app, sharedContext, passport, auth) {
  "use strict";

  app.get('/entries', function(req, res){
    var query = req.query;
    var sortOptions = _.pick(query, 'sort', 'order');
    listEntries(sortOptions, function(err, entries) {
      if(err) {
        res.send(404);
      } else {
        res.render('entries/list', buildPageContext(req,{entries: entries, sortOptions: sortOptions}, sharedContext));
      }
    });
  });

  app.get('/entry/:id', function(req, res) {
    Entry.findById(req.params.id).select("title type").exec(function(err, entry) {
      if(err) {
        return res.send(404);
      }
      return res.render('entries/viewEntry', buildPageContext(req, {entry: entry}, sharedContext));
    });
  });

};