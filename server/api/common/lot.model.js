'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LotSchema = new Schema({
  customerId:String,
  lotNumber:String,
  primaryImg:String,
  auctionId:String,
  assetId:String,
  assetDesc:String,
  startingPrice:Number,
  reservePrice:Number,
  startDate:String,
  endDate:String, 
  bidIncrement:Number,
  lastMintBid:String,
  extendedTo:String,
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Lot', LotSchema);