'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceEnquirySchema = new Schema({
  type : String,
  quote : {},
  createdAt: Date
});

module.exports = mongoose.model('ServiceEnquiry', ServiceEnquirySchema);