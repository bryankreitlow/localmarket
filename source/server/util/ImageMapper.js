/* jslint node:true, es5:true */
"use strict";

var logger = require('./Logger');
var fs = require("fs");
var path = require("path");

logger.configure({
  messageLog: "<console>",
  levelDebug: false
});

exports.build = function (_srcDir, _dstDir, _mapBase) {
  var list = [];
  var buildErrors = false;
  var srcDir  = path.normalize(_srcDir);
  var dstDir  = path.normalize(_dstDir ? _dstDir : "");
  var mapBase = path.normalize(_mapBase ? _mapBase : "");
  logger.debug("IMAGE SRC: "+srcDir, 'build');
  logger.debug("IMAGE DST: "+dstDir, 'build');
  logger.debug("MAP DST: "+mapBase, 'build');

  //
  // traverse directory tree and find files
  //
  var traverseFileSystem = function (currentPath) {
    var files = fs.readdirSync(currentPath);
    for (var i in files) {
      if (files.hasOwnProperty(i)) {
        var currentFile = path.join(currentPath, files[i]);
        var stats = fs.statSync(currentFile);

        // if entry is a file
        // and has an image extension
        // and is NOT a retina image (aka @2x)
        // then add it to the found list
        if (stats.isFile() && (/\.(gif|jpg|jpeg|png)$/i).test(currentFile) && !(/@2x/).test(currentFile)) {
          list.push({filename:currentFile, hash:stats.size});
        }
        else if (stats.isDirectory()) {
          traverseFileSystem(currentFile);
        }
      }
    }
  };

  traverseFileSystem(srcDir);

  var lessMap = [];
  var jsonMap = [];

  //
  // Vonvert file system filename to less variable
  //
  var toVarname = function (name) {
    name = name.replace(srcDir+'/', '');                    // remove base directory
    name = name.replace(/\//g, '_');                    // convert '/' to '_'
    name = name.replace(/\.(gif|jpg|jpeg|png)$/, '');   // remove image extensions
    return name.toLowerCase();
  };


  for(var i=0; i< list.length; i++){
    var filename = list[i].filename;
    var varname = toVarname(filename);
    logger.debug("varname: "+varname, 'build');
    logger.debug("map from: "+filename, 'build');
    filename = filename.replace(srcDir, '') + '?v' + list[i].hash.toString(36);
    filename = path.join(dstDir, filename);
    logger.debug("map to:   "+filename, 'build');

    var padding = '                                                ';
    var pad = Math.max(0, Math.floor(padding.length-varname.length));
    lessMap.push('@' + varname + ': ' + padding.substring(0, pad) + '"' + filename + '";');
    jsonMap.push('"' + varname + '" : "' + filename + '"');
  }

  // Write the LESS image map file

  var less_filename = path.join(mapBase, "source/client/source/less/image-map.less");
  lessMap = "//\n// DO NOT EDIT THIS FILE\n// Automatically generated at runtime\n//\n" + lessMap.join('\n');
  try {
    fs.writeFileSync(less_filename,lessMap);
    logger.info("LESS image map written to: " + less_filename, "Build");
  }
  catch (err) {
    logger.error(err, "Build");
    buildErrors = true;
  }

  // write the javascript map file
  var json_filename = path.join(mapBase, "source/server/gen.source/image-map.json");
  jsonMap = '{\n' + jsonMap.join(',\n') + '\n}';
  try {
    fs.writeFileSync(json_filename, jsonMap);
    logger.info("JSON image map written to: " + json_filename, "Build");
  }
  catch (err) {
    logger.error(err, "Build");
    buildErrors = true;
  }

  return buildErrors;
};