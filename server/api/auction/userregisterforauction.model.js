'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserRegForAuctionSchema = new Schema({
  auction:{},
  user:{},
  lotNumber:[],
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('UserRegForAuction', UserRegForAuctionSchema);