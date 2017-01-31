'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NegotiationSchema = new Schema({
  user: {},
  product : {},
  type:String,
  offer:Number,
  negotiation:String,
  createdAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Negotiation', NegotiationSchema);