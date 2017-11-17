// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NewEquipmentBannerSchema = new Schema({
  brand:{
    _id:{type:String},
    name:String
  },
  position:String,
  order:String,
  promotion:{
      pro_id:{type:String},
      name:String
  },
  newEquipBannerImg: String,
  status:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('NewEquipmentBanner', NewEquipmentBannerSchema);
