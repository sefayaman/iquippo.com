'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ManpowerUserSchema = new Schema({
  user:{},
  assetOperated:[String],
  resumeDoc: String,
  availableFrom: Date,
  work: String,
  fees: Number,
  docDir: String,
  status:{
    type: Boolean,
    default: true
  },
  deleted:{
    type: Boolean,
    default: false
  },
  experience: Number,
  certificates: String,
  notes: String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now},
  createdBy : {},
  updatedBy : {},
  activatedBy : {}
});


module.exports = mongoose.model('ManpowerUser', ManpowerUserSchema);