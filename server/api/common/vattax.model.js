'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VatTaxSchema = new Schema({
  taxType:String,
  group:{type:Schema.Types.ObjectId,ref:'Group'},
  category:{type:Schema.Types.ObjectId,ref:'Category'},
  state:{type:Schema.Types.ObjectId,ref:'State'},
  effectiveFromDate:Date,
  effectiveToDate:Date,
  amount:{type:Number},
  status:{type:Boolean,default:true},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('VatTax', VatTaxSchema);