'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LotSchema = new Schema({
  auctId:String,
  lotId:String,
  assetId:String,
  assetDesc:String,
  startPrice:String,
  ReservePrice:String,
  lastMintBid:String,
  extendedTo:String,
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Lot', LotSchema);