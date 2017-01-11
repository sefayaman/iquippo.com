'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BannerSchema = new Schema({
  name: String,
  code:String,
  regCharge:{
    type: Number,
    default: 0
  },
  sDate:{type:Date,default:Date.now},
  eDate:{type:Date,default:Date.now},
  hyperlink:String,
  ticker:String,
  webImg: String,
  showInMobile:String,
  mobileImg:String,
  status:{type:String,default:'active'},
  deleted: {
    type: Boolean,
    default: false
  },
  sequence:{type:Number,default:0},
  default:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Banner', BannerSchema);