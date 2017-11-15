// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CertificateSchema = new Schema({
  name:String,
  description:String,
  primaryImg:String,
  logoImg:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Certificate', CertificateSchema);
