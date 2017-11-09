'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupSchema = new Schema({
  name: String,
  description: String,
  imgSrc:String,
  visibleOnUsed:{type:Boolean,default:true},
  isForNew:{type:Boolean,default:false},
  isForUsed:{type:Boolean,default:false},
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('Group', GroupSchema);