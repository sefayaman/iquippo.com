'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LegalEntityTypeSchema = new Schema({
  legalType:String,
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('LegalEntityType', LegalEntityTypeSchema);