'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VendorSchema = new Schema({
  user:{},
  entityName: String,
  partnerId:String,
  services: [String],
  url: String,
  status:{
    type: Boolean,
    default: true
  },
  deleted:{
    type: Boolean,
    default: false
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Vendor', VendorSchema);