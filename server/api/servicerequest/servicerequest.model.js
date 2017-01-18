'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceRequesetSchema = new Schema({
  type : String,
  user : {},
  product : {},
  request : {},
  createdAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ServiceRequeset', ServiceRequesetSchema);