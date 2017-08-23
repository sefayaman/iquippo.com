'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LotSchema = new Schema({
  userId:String,
  lotNumber:String,
  auctionId:String,
  assetId:String,
  assetDesc:String,
  startingPrice:Number,
  reservePrice:Number,
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Lot', LotSchema);