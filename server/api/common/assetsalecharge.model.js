'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var assetSaleChargeSchema = new Schema({
  user:{
      userId: {type:Schema.Types.ObjectId,ref:'User'},
      mobile: String,
      name: String,  
     },
  userRole:String,
  enterpriseId:String,
  category:{
          categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
          name:String
          },
  effectiveFromDate:Date,
  effectiveToDate:Date,
  chargeBasis:String,
  amount:Number,
  status:{type:String,default:'active'},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('assetSaleCharge', assetSaleChargeSchema);