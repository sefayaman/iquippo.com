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
  startDate:Date,
  endDate:Date, 
  bidIncrement:Object,
  static_increment:String,
  lastMintBid:String,
  extendedTo:String,
  status:{type:Boolean,default:true},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Lot', LotSchema);