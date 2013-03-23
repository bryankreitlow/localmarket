/*jslint node:true, es5:true */

var stateList = require('./../components/StateList');
var buildPageContext = require('../utils/ContextUtil').buildPageContext;

module.exports = function(app, sharedContext) {
  "use strict";

  app.get('/mapNew', function(req, res){
    res.render('googleMap', buildPageContext(req, { page: 'map' }, sharedContext));
  });

  app.get('/map', function(req, res){
    res.render('map', buildPageContext(req, { page: 'map' }, sharedContext));
  });

  app.get('/map/:state', function(req, res){
    var state = req.params.state;
    var stateName = stateList[state];
    if(stateName === undefined ) {
      res.send(403, 'Sorry! This does not appear to be a valid state.');
    } else {
      res.render('state', buildPageContext(req, { state: stateName }, sharedContext));
    }
  });

};