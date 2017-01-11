'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ManufacturerSchema = new Schema({
  name: String,
  imgsrc: String,
  status:{type:String,default:'active'},
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Manufacturer', ManufacturerSchema);