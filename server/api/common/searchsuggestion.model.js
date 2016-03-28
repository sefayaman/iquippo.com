'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SearchSuggestion = new Schema({
  text: String,
  clickCount: {type:Number,default:0},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('SearchSuggestion', SearchSuggestion);