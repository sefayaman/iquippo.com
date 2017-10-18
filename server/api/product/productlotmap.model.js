'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AssetsInAuctionSchema = new Schema({
  asset_Id:String,
  assetId:String,
  auction_id:String,
  assetDesc:String,
  primaryImg:String,
  images:[],
  seller:{},
  lot_id:String,
  status:{type:Boolean,default:true},
  isDeleted:{type:Boolean,default:false},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AssetsInAuction', AssetsInAuctionSchema);