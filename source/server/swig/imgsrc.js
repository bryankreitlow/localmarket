/*jslint node:true, es5:true */
"use strict";

var helpers = require('swig/lib/helpers');
var image_map = require('../gen.source/image-map.json');

/**
 * {% imgsrc {image_key} %}
 *
 * returns quoted path to image with cache string
 *
 */
module.exports = function (indent, parser) {

    if (this.args.length !== 1) {
        throw new Error('Expecting 1 parameter. Found ' + this.args.length + ' in {% imgsrc '+ this.args.join(' ') +' %}');
    }

    var key = this.args[0];
    if (!image_map.hasOwnProperty(key)) {
        throw new Error('Unknown image key ' + key + ' in {% imgsrc '+ this.args.join(' ') +' %}');
    }

    // result
    return '_output +="\'' + image_map[key] + '\'";';
};