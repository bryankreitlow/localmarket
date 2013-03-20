/*jslint node:true, es5:true */

var stateList = require('./../../../components/StateList');

module.exports = function(app) {
  "use strict";

  app.get('/mapNew', function(req, res){
    res.render('googleMap', { page: 'map' });
  });

  app.get('/map', function(req, res){
    res.render('map', { page: 'map' });
  });

  app.get('/map/', function(req, res){
    res.render('map', { page: 'map' });
  });

  app.get('/map/:state', function(req, res){
    var state = req.params.state;
    var stateName = stateList[state];
    if(stateName === undefined ) {
      res.send(403, 'Sorry! This does not appear to be a valid state.');
    } else {
      res.render('state', { page: 'map', state: stateName });
    }
  });

};