/*jslint node:true, es5:true */

var buildPageContext = require('../utils/ContextUtil').buildPageContext;

module.exports = function(app, sharedContext) {
  "use strict";

  app.get('/', function(req, res) {
    res.render('index', buildPageContext(req, { page: 'home'}, sharedContext));
  });

  app.get('/about', function(req, res){
    res.render('about', buildPageContext(req, { page: 'about'}, sharedContext));
  });
};