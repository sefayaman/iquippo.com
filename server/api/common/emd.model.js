'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EmdSchema = new Schema({
  auction_id:String,
  selectedLots:[],
  status:{type:Boolean,default:true},
  emdAmount:String,
  isDeleted:{type:Boolean,default:false},
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});
  
module.exports = mongoose.model('Emd', EmdSchema);