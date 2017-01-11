'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupSchema = new Schema({
  name: String,
  description: String,
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('Group', GroupSchema);