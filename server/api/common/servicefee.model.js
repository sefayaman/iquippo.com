'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceFeeSchema = new Schema({
  serviceType:String,
  enterpriseName:String,
  agency:{
    _id:String,
    name:String
  },
  effectiveToDate:Date,
  chargeBasis:String,
  amount:Number,
  status:{type:Boolean,default:true},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ServiceFee', ServiceFeeSchema);