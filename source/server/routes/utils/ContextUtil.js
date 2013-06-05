/*jslint node:true, es5:true */

var _ = require('underscore');

var buildPageContext = function(req, additions, sharedContext) {
  "use strict";
  var userName = false;
  if(req.user) {
    userName = req.user.fullName();
  }
  return _.extend({}, additions, {userName: userName}, sharedContext);
};



module.exports = {
  buildPageContext: buildPageContext,
  notfounderror: function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
  }
};