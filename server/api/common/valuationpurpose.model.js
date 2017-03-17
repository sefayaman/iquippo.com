'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PurposeSchema = new Schema({
  name: String,
  desc:String,
  createdBy:{},
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ValuationPurpose', PurposeSchema);