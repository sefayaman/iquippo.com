'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ModelSchema = new Schema({
  name: String,
  user:{},
  group:{},
  category:{},
  brand:{},
  isForNew:{type:Boolean,default:false},
  isForUsed:{type:Boolean,default:false},
  createdAt:Date,
  updatedAt:Date
});

module.exports = mongoose.model('Model', ModelSchema);


