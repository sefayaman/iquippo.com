'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceTaxSchema = new Schema({
  type:String,
  effectiveFromDate:{type:Date},
  effectiveToDate:{type:Date},
  taxRate:{type:Number},
  status:{type:Boolean,default:true},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ServiceTax', ServiceTaxSchema);