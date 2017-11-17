'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GroupSchema = new Schema({
  name: String,
  description: String,
  imgSrc:String,
  visibleOnUsed:{type:Boolean,default:true},
  visibleOnNew:{type:Boolean,default:false},
  isForNew:{type:Boolean,default:false},
  isForUsed:{type:Boolean,default:false},
  priorityForUsed:{type:Number,default:0},
  priorityForNew:{type:Number,default:0},
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('Group', GroupSchema);