/*jslint node:true, es5:true */
"use strict";

/*
 *  Generic require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login?url='+req.originalUrl);
  }
  next();
};

exports.requiresModerator = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  if(!req.user.isModerator()){
    return res.send(403);
  }
  next();
};

exports.requiresAdmin = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  if(!req.user.isAdmin()){
    return res.send(403);
  }
  next();
};


/*
 *  User authorizations routing middleware
 */
exports.account = {
  hasAuthorization : function (req, res, next) {
    if (req.profile.id !== req.user.id) {
      return res.redirect('/account/'+req.profile.id);
    }
    next();
  }
};

