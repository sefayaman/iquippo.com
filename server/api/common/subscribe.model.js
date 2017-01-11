'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SubscribeSchema = new Schema({
  email: { type: String, lowercase: true },
  createdAt: {type:Date,default:Date.now},
});

module.exports = mongoose.model('Subscribe', SubscribeSchema);