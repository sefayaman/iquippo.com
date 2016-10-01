// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var sequence = require('./../../components/seqgenerator').sequence();
var PaymentTransactionSchema = new Schema({
  product: {},
  user:{},
  transactionId:String,
  payments:[{}],
  totalAmount:Number,
  requestType:String,
  ccAvenueRes:{},
  statusCode : {type:Number,default:-1},
  status:{type:String,default:'listed'},
  statuses:[{}],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

PaymentTransactionSchema.pre('save', function(next){
  var doc = this;
  // get the next sequence
  sequence.next(function(nextSeq){
    doc.transactionId = nextSeq;
    next();
  },"payment");
});

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
