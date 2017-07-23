'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseMasterSchema = new Schema({
  user: {
      userId: {type:Schema.Types.ObjectId,ref:'User'},
      mobile: String,
      name: String,  
    },
  userRole:String,
  enterpriseId:String,
  functionality:String,
  buyNowPriceApproval:{type:String,default:"No"},
  negotiatedSaleApproval:{type:String,default:"No"},
  coolingPeriod:Number,
  emdPeriod:Number,
  fullPaymentPeriod:Number,
  status:{type:String,default:"active"},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('EnterpriseMaster', EnterpriseMasterSchema);