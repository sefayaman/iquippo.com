'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BuyerSchema = new Schema({
  seller: {},
  product: {},
  fname: String,
  mname: String,
  lname: String,
  country: String,
  phone: String,
  mobile: String,
  email: { type: String, lowercase: true },
  contact: {
    type: String,
    default: 'email'
  },
  message: String,
  createdAt: Date,
  updatedAt: Date
});

module.exports = mongoose.model('Buyer', BuyerSchema);