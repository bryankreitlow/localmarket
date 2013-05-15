/*jslint node:true, es5:true */
"use strict";

var express = require('express.io'),
  path = require('path'),
  mongoStore = require('connect-mongo')(express),
  flash = require('connect-flash'),
  consolidate = require('consolidate'),
  swig = require('swig');

module.exports = function (app, config, passport) {
  app.set('showStackError', true);
  // should be placed before express.static
  app.use(express.compress({
    filter: function (req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));
  app.use("/assets", express.static('../../static/assets'));
  //Fav icon
  app.use(express.favicon('../../static/favicon/favicon.ico', { maxAge: 2592000000 }));
  app.use(express.logger('dev'));

  // set views path, template engine and default layout
  app.set('views', 'views');
  app.set('view engine', 'html');
  app.engine('.html', consolidate.swig);

  app.configure(function () {
    // cookieParser should be above session
    app.use(express.cookieParser());

    // bodyParser should be above methodOverride
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // express/mongo session storage
    app.use(express.session({
      secret: 'TheUltimateSessionSecret',
      store: new mongoStore({
        url: config.getMongoDBConnectionString(),
        maxAge: 300000,
        auto_reconnect: true,
        collection : (config.isProduction()) ? 'sessions' : 'devsessions'
      })
    }));

    // NOTE: Swig requires some extra setup
    // This helps it know where to look for includes and parent templates
    swig.init({
      root: path.join(__dirname, '../views'),
      cache: false,
//      tags: {
//        imgsrc:require('../swig/imgsrc.js')
//      },
      allowErrors: true // allows errors to be thrown and caught by express instead of suppressed by Swig
    });

    // connect flash for flash messages
    app.use(flash());

    // use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    // routes should be at the last
    app.use(app.router);
  });

};