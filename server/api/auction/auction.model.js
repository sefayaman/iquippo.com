// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AuctionRequestSchema = new Schema({
  user: {},
  product:{},
  seller:{},
  auctionId:String,
  dbAuctionId:String,
  emdAmount : Number,
  external:{type:Boolean,default:false},
  status:{type:String,default:"Request Submitted"},
  transactionId:String,
  primaryImg: String,
  valuation:{},
  statuses:[{}],
  valuationReport:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AuctionRequest', AuctionRequestSchema);

