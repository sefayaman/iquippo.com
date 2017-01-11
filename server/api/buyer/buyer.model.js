// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BuyerSchema = new Schema({
  seller: {},
  product: [],
  spares: [],
  fname: String,
  mname: String,
  lname: String,
  country: String,
  phone: String,
  mobile: String,
  email: { type: String, lowercase: true },
  requestType:{type:String,default:'contactInfo'},
  transactionId:String,
  contact: {
    type: String,
    default: 'email'
  },
  interestedIn: String,
  financeInfo: {},
  message: String,
  createdAt: Date,
  updatedAt: Date
});


module.exports = mongoose.model('Buyer', BuyerSchema);
