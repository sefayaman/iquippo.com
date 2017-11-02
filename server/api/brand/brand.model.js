'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: String,
  user:{},
  group:{},
  category:{},
  createdAt:Date,
  updatedAt:Date,
  useFor: String
});

module.exports = mongoose.model('Brand', BrandSchema);