'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClassifiedadSchema = new Schema({
  userid: String,
  fname: String,
  mname: String,
  lname: String,
  phone: String,
  mobile: String,
  email: String,
  image: String,
  websiteUrl:String,
  //position: String,
  position: {
    type: String,
    default: 'none'
  },
  status: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  updatedByUserId:String, 
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Classifiedad', ClassifiedadSchema);