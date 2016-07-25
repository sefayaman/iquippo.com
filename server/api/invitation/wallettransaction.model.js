'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WalletTransactionSchema = new Schema({
  user:{},
  refBy:{},
  creditAmount:{
    type: Number,
    default: 0
  },
  debitAmount:{
    type: Number,
    default: 0
  },
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);