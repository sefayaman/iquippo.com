'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceFeeSchema = new Schema({
  serviceType:String,
  enterpriseId:String,
  enterpriseName:String,
  agency:{
    _id:String,
    name:String,
    partnerId:String,
  },
  effectiveFromDate:Date,
  effectiveToDate:Date,
  chargeBasis:String,
  amount:Number,
  status:{type:Boolean,default:true},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ServiceFee', ServiceFeeSchema);