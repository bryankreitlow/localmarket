/*jslint node:true, es5:true */

"use strict";
var https = require('https');
var _  = require('underscore');
var querystring = require('querystring');
var url = require('url');
var config = require('../../util/Config');
var logger = require("../../util/Logger");

var LogCategory = "Proxy";

var apiKey = 'apiKey=' + config.get(config.MongoLabApiKey);
var MongoLabBasePath = config.get(config.MongoLabBasePath);

// Setup Rest Host Info
var options = {
  host: config.get(config.MongoLabBaseUrl)
};

// Function for setting content-length header in case we need it.
// http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
function lengthInUtf8Bytes(str) {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}

var upstreamIgnoredHeaders = {
  "server": 1,
  "cache-control": 1,
  "pramga": 1,
  "expires": 1
};

// Sends a response back to the client.  upstreamResponse can be null, status is
// optional (will be 200 if not set).
var sendResponse = function(upstreamResponse, clientResponse, responseData, status) {
  var hasContentLengthHeader = false;
  if (upstreamResponse) {
    _.each(upstreamResponse.headers, function(v,k) {
      var kLower = k.toLowerCase();
      if (!upstreamIgnoredHeaders[kLower]) {
        clientResponse.header(k,v);
      }
      if (!hasContentLengthHeader && kLower === "content-length") {
        hasContentLengthHeader = true;
      }
    });
  }

  if (status) {
    clientResponse.status(status);
  } else if (upstreamResponse) { //forward status code from upstream
    clientResponse.status(upstreamResponse.statusCode);
  }

  // discourage caching with these headers
  clientResponse.header("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0");
  clientResponse.header("Pragma", "no-cache");
  clientResponse.header("Expires", "Thu, 1 Jan 1970 00:00:00 GMT");

  // Warn if server is not setting content-length, and set it here
  if (!hasContentLengthHeader) {
    logger.info("Upstream Server did not set content length; setting it", LogCategory);
    clientResponse.header("content-length", lengthInUtf8Bytes(responseData));
  }
  clientResponse.end(responseData);
};

module.exports = function(app, buildPageContext, passport, auth) {
  app.all('/labapi/*', auth.requiresLogin, function (req, res, next) {
    var postBody = req.body;
    var reqOptions = _.extend({}, options, {
      path: MongoLabBasePath + req.path.substring(7),
      method: req.route.method,
      headers: req.headers,
      rejectUnauthorized: false //TODO - this is set because new versions of node check the ssl certs
    });

    // Append the query string, if it exists
    if(_.isEmpty(req.query)){
      reqOptions.path += '?' + apiKey;
    } else {
      reqOptions.path += '?' + querystring.stringify(req.query) + '&' + apiKey;
    }

    if(postBody && !reqOptions.headers['content-length']) {
      reqOptions.headers['content-length'] = lengthInUtf8Bytes(JSON.stringify(postBody));
    }

    var proxyRequest = https.request(reqOptions);
    proxyRequest.on('response', function(response) {
      var responseBody = "";
      response.on('data', function(chunk) {
        responseBody += chunk.toString('utf-8');
      });
      response.on('end', function () {
        sendResponse(response,res,responseBody);
      });
    });
    proxyRequest.on('error', function(e) {
      logger.error("Failed api proxy request to: " + options.host + ":" + options.port + ": " + e, LogCategory);
      sendResponse(null,res,JSON.stringify({ "message": "Proxy Request Failed"}) ,500);
    });
    if(postBody) {
      proxyRequest.write(JSON.stringify(postBody));
    }
    proxyRequest.end();
  });
};