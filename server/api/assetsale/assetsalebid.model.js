'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AssetSaleBidSchema = new Schema({
  ticketId:String,
  userId:{type:Schema.Types.ObjectId,ref:'User'},
  productId:{type:Schema.Types.ObjectId,ref:'Product'},
  state:String,
  bidAmount:Number,
  offerStatus:String,
  bidStatus:String,
  dealStatus:String,
  assetStatus:String,
  tradeType:String,
  proxyBid:{type:Boolean,default:false},
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AssetSaleBid', AssetSaleBidSchema);
