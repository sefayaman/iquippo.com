'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserRegForAuctionSchema = new Schema({
  auction:{},
  user:{},
  selectedLots:[],
  registrationKit:String,
  undertakingKit:String,
  transactionId:String,
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('UserRegForAuction', UserRegForAuctionSchema);