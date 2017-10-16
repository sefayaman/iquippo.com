'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OfflineSchema = new Schema({
  amount: String,
  transactionid: String,
  bank: String,
  dop: String,
  branch: String,
  user:{},  
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Offline', OfflineSchema);
