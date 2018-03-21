'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LotSchema = new Schema({
  user_id:String,
  lotNumber:String,
  auction_id:String,
  auctionId:String,
  auctionType: String,
  startingPrice:Number,
  reservePrice:Number,
  startDate:Date,
  endDate:Date, 
  //bidIncrement:Object,
  bidIncrement:[{}],
  static_increment:Number,
  lastMinuteBid:Number,
  extendedTo:Number,
  status:{type:Boolean,default:true},
  isDeleted:{type:Boolean,default:false},
  reqSubmitStatus:{type:String,default:"Request Failed"},
  lotStatus:{type:String,default:'Open'},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Lot', LotSchema);