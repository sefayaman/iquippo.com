'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceEnquirySchema = new Schema({
  type : String,
  quote : {},
  createdAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('ServiceEnquiry', ServiceEnquirySchema);