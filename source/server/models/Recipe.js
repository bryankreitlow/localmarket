/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var IngredientSchema = new mongoose.Schema({
  quantity: {
    type: String,
    required: true
  },
  unitOfMeasure: {
    type: String,
    required: true
  },
  _food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    index: true
  }
});

var RecipeSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    required: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [IngredientSchema]
});

RecipeSchema.plugin(timestamps);

mongoose.model('Recipe', RecipeSchema);

module.exports = {
  Name: 'Recipe',
  Schema: RecipeSchema,
  Model: mongoose.model('Recipe')
};