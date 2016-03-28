'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VendorSchema = new Schema({
  fname: String,
  mname: String,
  lname: String,
  email: String,
  phone: String,
  mobile: String,
  entityName: String,
  country: String,
  services: [String],
  imgsrc: String,
  createdAt: Date,
  updatedAt: Date
});

module.exports = mongoose.model('Vendor', VendorSchema);