/*jslint node:true, es5:true */

var stateList = require('./../components/StateList');
var buildPageContext = require('../utils/ContextUtil').buildPageContext;

module.exports = function(app, sharedContext) {
  "use strict";

  app.get('/map', function(req, res){
    var location;
    if(req.user && req.user.location) {
      location = (req.user.location[0]) ? {lat: req.user.location[1], long: req.user.location[0]} : {lat: "false", long: "false"};
    } else {
      location = (req.session.location) ? (req.session.location) : {lat: "false", long: "false"};
    }
    res.render('map/map', buildPageContext(req, { page: 'map', location: location }, sharedContext));
  });

  app.get('/mapOld', function(req, res){
    res.render('map/oldmap', buildPageContext(req, { page: 'map' }, sharedContext));
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