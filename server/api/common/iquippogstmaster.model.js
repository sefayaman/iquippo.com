'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var IquippoGSTMasterSchema = new Schema({
  stateId:String,
  state:String,
  country:String,
  gstin:String,
  createdBy:{},
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('IuippoGstMaster', IquippoGSTMasterSchema);