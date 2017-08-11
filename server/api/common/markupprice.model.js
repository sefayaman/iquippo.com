'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var markupPriceMasterSchema = new Schema({
  enterpriseId:String,
  price:Number,
  status:{type:String,default:"active"},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('markupPriceMaster', markupPriceMasterSchema);