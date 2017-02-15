// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var sequence = require('./../../components/seqgenerator').sequence();
var ValuationRequestSchema = new Schema({
  user: {},
  seller:{},
  initiatedBy:String,
  requestId:String,
  valuationAgency:{},
  product: {},
  transactionId:String,
  status:{type:String},
  statuses:[{}],
  comment:String,
  report:String,
  purpose:String,
  isAuction:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

ValuationRequestSchema.pre('save', function(next){
  var doc = this;
  // get the next sequence
  sequence.next(function(nextSeq){
    doc.requestId = 'VR'+nextSeq;
    next();
  },"valuation");
});

module.exports = mongoose.model('ValuationRequest', ValuationRequestSchema);
