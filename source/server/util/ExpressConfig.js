/*jslint node:true, es5:true */
"use strict";

var express = require('express.io'),
  path = require('path'),
  mongoStore = require('connect-mongo')(express),
  flash = require('connect-flash'),
  consolidate = require('consolidate'),
  xsrf = require('./middleware/xsrf'),
  protectJSON = require('./middleware/protectJSON');

module.exports = function (app, config, passport) {
  //  protect JSON
  app.use(protectJSON);

  app.set('showStackError', true);

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

    // XSRF Avoidance
//    app.use(xsrf);

    // connect flash for flash messages
    app.use(flash());

    // use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    // routes should be at the last
    app.use(app.router);
  });

};