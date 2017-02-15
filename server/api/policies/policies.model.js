'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PoliciesSchema = new Schema({
  user: {},
  type:String,
  content:String,
  createdAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Policy', PoliciesSchema);