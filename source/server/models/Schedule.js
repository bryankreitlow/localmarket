/*jslint node:true, es5:true */
"use strict";

var mongoose = require('mongoose');

var timestamps = require('mongoose-timestamp');

var ScheduleSchema = new mongoose.Schema({
  day: {
    type: String, enum : ["Monday", "Tuesday", "Wednesday", "Thrusday", "Friday", "Saturday", "Sunday"],
    required: true
  },
  openingTime: {
  	type: Number,
    required: true
  },
  closingTime: {
  	type: Number,
    required: true
  }
});

ScheduleSchema.plugin(timestamps);

var Schedule = mongoose.model('Schedule', ScheduleSchema);

module.exports = {
  Name: 'Schedule',
  Schema: ScheduleSchema,
  Model: Schedule,
  Methods: ScheduleSchema.methods
};