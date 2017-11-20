'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: String,
  user:{},
  group:{},
  category:{},
  position:{},
  imgSrc:String,
  imgNewEquipmentSrc:String,
  visibleOnUsed:{type:Boolean,default:false},
  visibleOnNew:{type:Boolean,default:false},
  isForNew:{type:Boolean,default:false},
  isForUsed:{type:Boolean,default:false},
  priorityForUsed:{type:Number,default:0},
  priorityForNew:{type:Number,default:0},
  createdAt:Date,
  updatedAt:Date,
  useFor: String
});

module.exports = mongoose.model('Brand', BrandSchema);