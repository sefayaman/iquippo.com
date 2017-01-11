'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CallbackSchema = new Schema({
  fname: String,
  mname: String,
  lname: String,
  phone: String,
  mobile: String,
  email: String,
  createdAt: Date
});

module.exports = mongoose.model('Callback', CallbackSchema);