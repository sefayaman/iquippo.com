'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: String,
  user:{},
  group:{},
  category:{},
  imgSrc:String,
  visibleOnUsed:{type:Boolean,default:false},
  isForNew:{type:Boolean,default:false},
  isForUsed:{type:Boolean,default:false},
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('Brand', BrandSchema);