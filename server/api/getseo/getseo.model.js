'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var seoSchema = new Schema({
  categoryId:String,
  title: String,
  meta: String,
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('seo', seoSchema);