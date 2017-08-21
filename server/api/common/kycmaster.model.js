'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KycMasterSchema = new Schema({
  kycType:String,
  docName:String,
  status:{type:String,default:"active"},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('KycMaster', KycMasterSchema);