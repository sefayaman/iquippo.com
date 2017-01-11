'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProductHistorySchema = new Schema({
  type:String,
  history:{},
  user:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ProductHistory', ProductHistorySchema);