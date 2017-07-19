'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var assetSaleChargeSchema = new Schema({
  enterpriseId:String,
  category:{type:Schema.Types.ObjectId,ref:'Category'},
  effectiveFromDate:Date,
  effectiveToDate:Date,
  chargeBasis:String,
  amount:Number,
  status:{type:String,default:'active'},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('assetSaleCharge', assetSaleChargeSchema);