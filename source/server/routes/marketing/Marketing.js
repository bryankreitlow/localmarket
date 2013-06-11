/*jslint node:true, es5:true */

module.exports = function(app, buildPageContext, passport, auth) {
  "use strict";

  app.get('/index', function(req, res) {
    res.redirect('/');
  });

  app.get('/index.html', function(req, res) {
    res.redirect('/');
  });

  app.get('/', function(req, res) {
    res.render('index', buildPageContext(req, { page: 'home'}));
  });

  app.get('/about', function(req, res){
    res.render('about', buildPageContext(req, { page: 'about'}));
  });
};