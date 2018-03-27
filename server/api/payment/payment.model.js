// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var sequence = require('./../../components/seqgenerator').sequence();
var PaymentTransactionSchema = new Schema({
  product: {},
  auctionId:String,
  auctionName:String,
  auctionType: String,
  auction_id:{type:Schema.Types.ObjectId,ref:'AuctionMaster'},
  emdTax:String,
  entityName : String,
  user:{},
  transactionId:String,
  payments:[{}],
  totalAmount:Number,
  emd:Number,
  agreeOnUndertaking:{type:Boolean,default:false},
  registrationKit:String,
  undertakingKit:String,
  requestType:String,
  ccAvenueRes:{},
  ccAvenueData:{},
  kycUploadlater:String,
  paymentMode : {type:String,default:'online'},
  statusCode : {type:Number,default:-1},
  selectedLots:[],
  status:{type:String,default:'listed'},
  reqSubmitStatus:{type:String,default:"Request Failed"},
  statuses:[{}],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

PaymentTransactionSchema.pre('save', function(next){
  var doc = this;
  if(doc.transactionId)
    return next();
  // get the next sequence
  sequence.next(function(nextSeq){
    doc.transactionId = nextSeq;
    next();
  },"payment");
});

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
