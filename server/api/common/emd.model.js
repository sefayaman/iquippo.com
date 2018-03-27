'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EmdSchema = new Schema({
  auction_id:String,
  auctionId:String,
  auctionType: String,
  selectedLots:[{}],
  status:{type:Boolean,default:true},
  emdAmount:Number,
  isDeleted:{type:Boolean,default:false},
  reqSubmitStatus:{type:String,default:"Request Failed"},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});
  
module.exports = mongoose.model('Emd', EmdSchema);