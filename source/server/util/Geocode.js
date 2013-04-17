/*jslint node:true, es5:true */
"use strict";
var logger = require("./Logger");
var request = require('request');
var LogCategory = "Geocode";

module.exports = {
 geocodeAddress: function(address, callback) {
    logger.info("Address " + address, LogCategory);
    request.get({url : 'http://maps.googleapis.com/maps/api/geocode/json?address=' + address +'&sensor=false', json: true}, function(error, response, body) {
      if(error) {
        callback(true, null);
      } else {
        callback(false, body);
      }
    });
  }
};