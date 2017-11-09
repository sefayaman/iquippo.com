// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NewEquipmentSchema = new Schema({
  certificate:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('NewEquipment', NewEquipmentSchema);
