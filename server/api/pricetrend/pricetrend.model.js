'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TrendvalSchema = {
 	oemPrice:{
     excellentCondition:Number,
    goodCondition:Number,
    averageCondition:Number
  },
 	averagePrice:{
     excellentCondition:Number,
    goodCondition:Number,
    averageCondition:Number
  },
 	highestRealisedPrice:{
     excellentCondition:Number,
    goodCondition:Number,
    averageCondition:Number
  }

};

var PTrendSchema = new Schema({
  category: {},
  brand: {},
  model: {},
  mfgYear:Number,
  saleYear:Number,
  user:{},
  trendValue:TrendvalSchema,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('PriceTrend', PTrendSchema);