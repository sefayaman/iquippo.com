'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LotSchema = new Schema({
  user_id:String,
  lotNumber:String,
  auction_id:String,
  auctionId:String,
  startingPrice:Number,
  reservePrice:Number,
  startDate:Date,
  endDate:Date, 
  bidIncrement:Object,
  static_increment:String,
  lastMintBid:String,
  extendedTo:String,
  status:{type:Boolean,default:true},
  isDeleted:{type:Boolean,default:false},
  reqSubmitStatus:{type:String,default:"Request Submitted"},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Lot', LotSchema);