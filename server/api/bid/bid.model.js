// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BidSchema = new Schema({
  user:{},
  quantity:Number,
  valueperunit:Number,
  paymentmode:String,
  bannerInfo:{},
  paymentInfo:{},
  status:{type:String,default:"Pending"},
  statuses:[{}],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Bid', BidSchema);
