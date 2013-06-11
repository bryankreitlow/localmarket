/*jslint node:true, es5:true */

module.exports = function(app, buildPageContext, passport, auth) {
  "use strict";

  app.get('/map', function(req, res){
    var location;
    if(req.user && req.user.location) {
      location = (req.user.location[0]) ? {lat: req.user.location[1], long: req.user.location[0]} : {lat: "false", long: "false"};
    } else {
      location = (req.session.location) ? (req.session.location) : {lat: "false", long: "false"};
    }
    res.render('map/map', buildPageContext(req, { page: 'map', location: location }));
  });

};