'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CountSchema = new Schema({
  key: String,
  value: String,
  createdBy:{},  
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Count', CountSchema);