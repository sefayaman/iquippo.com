'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var cartSchema = new Schema({
  user: {},
  products: [{}],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Cart', cartSchema);