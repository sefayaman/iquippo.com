'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProductQuoteSchema = new Schema({
  fname: String,
  mname: String,
  lname: String,
  phone: String,
  mobile: String,
  country:String,
  city:String,
  companyname:String,
  desination:String,
  email: { type: String, lowercase: true },
  product:{},
  seller:{},
  shippingQuote:{},
  valuationQuote:{},
  certifiedByIQuippoQuote:{},
  createdAt: Date
});

module.exports = mongoose.model('ProductQuote', ProductQuoteSchema);