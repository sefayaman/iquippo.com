'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var QuoteSchema = new Schema({
  fname: String,
  mname: String,
  lname: String,
  phone: String,
  mobile: String,
  email: { type: String, lowercase: true },
  group: String,
  category: String,
  otherCategory: String,
  subcategory:String,
  brand: String,
  model: String,
  expPrice:String,
  city:String,
  agree:Boolean,
  comment: String,
  createdAt: Date
});

module.exports = mongoose.model('Quote', QuoteSchema);