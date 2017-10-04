'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ValuationCancellationSchema = new Schema({
  enterprise:{},
  amount:Number,
  valuationStatus:String,
  createdBy:{},
  status:{type:Boolean,default:true},
  deleted:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ValuationCancellationFee', ValuationCancellationSchema);