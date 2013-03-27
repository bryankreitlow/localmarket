/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var FoodSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String, enum: ["grown", "made"],
    required: true
  }
});

FoodSchema.plugin(timestamps);

// Unique requires custom validation
FoodSchema.pre("save", function(next, done) {
  var self = this;
  mongoose.models.Food.findOne({ name : self.name }, function(err, results) {
   if(err) {
     done(err);
   } else if(results) { //result found so food exists
     self.invalidate("name", "must be unique, duplicate record");
     done(new Error("Food name must be unique, duplicate found"));
   } else {
     done();
   }
  });
});

FoodSchema.methods = {
  listAll: function (options, cb) {
  var sort = options.sort;
  var order = (options.order === 'desc') ? '-' : '+';
  return mongoose.model('Food').find().sort(order + sort).exec(cb);
  }
};

mongoose.model('Food', FoodSchema);

module.exports = {
  Model: mongoose.model('Food'),
  Methods: FoodSchema.methods
};