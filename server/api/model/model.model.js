'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ModelSchema = new Schema({
  name: String,
  user:{},
  group:{},
  category:{},
  brand:{},
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('Model', ModelSchema);


