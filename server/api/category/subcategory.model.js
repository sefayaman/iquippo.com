'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SubCategorySchema = new Schema({
  name: String,
  user:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('SubCategory', SubCategorySchema);