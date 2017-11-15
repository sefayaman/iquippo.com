// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NewEquipmentBannerSchema = new Schema({
  brand:{
    data:{type:Schema.Types.ObjectId,ref:'Brand'},
    name:String
  },
  promotion:{
    data:{type:Schema.Types.ObjectId,ref:'Promotion'},
    name:String
  },
  position:{
    data:{type:Schema.Types.ObjectId,ref:'Position'},
    name:String
  },
  newEquipBannerImg: String,
  status:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('NewEquipmentBanner', NewEquipmentBannerSchema);
