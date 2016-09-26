// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AuctionRequestSchema = new Schema({
  user: {},
  product:{},
  auctionId:String,
  dbAuctionId:String,
  startDate:Date,
  endDate:Date,
  status:{type:String,default:"Request Submitted"},
  transactionId:String,
  valuationId:String,
  statuses:[{}],
  valuationReport:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AuctionRequest', AuctionRequestSchema);
