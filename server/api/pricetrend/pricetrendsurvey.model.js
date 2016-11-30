'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var PTrendSurveySchema = new Schema({
  user:{},
  product:{},
  priceTrend:{},
  agree:String,
  comment:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('PriceTrendSurvey', PTrendSurveySchema);