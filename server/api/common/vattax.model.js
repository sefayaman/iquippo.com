'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VatTaxSchema = new Schema({
  category:{type:Schema.Types.ObjectId,ref:'Category'},
  brand:{type:Schema.Types.ObjectId,ref:'Brand'},
  model:{type:Schema.Types.ObjectId,ref:'Model'},
  state:{type:Schema.Types.ObjectId,ref:'State'},
  amount:{type:Number},
  status:{type:Boolean,default:true},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('VatTax', VatTaxSchema);