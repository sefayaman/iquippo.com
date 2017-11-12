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
  visibleOnUsed:{type:Boolean,default:false},
  isForNew:{type:Boolean,default:false},
  isForUsed:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now},
  useFor: String
});

module.exports = mongoose.model('Category', CategorySchema);