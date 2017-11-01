'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: String,
  description: String,
  group: {},
  imgSrc: String,
  status: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now},
  categoryFor: String
});

module.exports = mongoose.model('Category', CategorySchema);