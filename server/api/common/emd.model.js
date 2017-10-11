'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EmdSchema = new Schema({
  auctionId:String,
  auctionName:String,
  selectedLots:[],
  status:{type:Boolean,default:true},
  amount:String,
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});
  
module.exports = mongoose.model('Emd', EmdSchema);