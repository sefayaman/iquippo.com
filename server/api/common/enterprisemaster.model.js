'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseMasterSchema = new Schema({
  enterpriseId:String,
  functionality:String,
  buyNowPriceApproval:String,
  negotiatedSaleApproval:String,
  coolingPeriod:Number,
  emdPeriod:Number,
  fullPaymentPeriod:Number,
  status:{type:String,default:"active"},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('EnterpriseMaster', EnterpriseMasterSchema);