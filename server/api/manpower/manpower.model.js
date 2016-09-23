'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['twitter', 'facebook', 'google','linkedin'];

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
  createdAt: Date,
  updatedAt: Date
});

module.exports = mongoose.model('ManpowerUser', ManpowerUserSchema);