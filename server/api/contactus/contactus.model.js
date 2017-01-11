'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ContactUsSchema = new Schema({
  name: String,
  email: String,
  mobile: String,
  message: String,
  createdAt:Date
});

module.exports = mongoose.model('ContactUs', ContactUsSchema);