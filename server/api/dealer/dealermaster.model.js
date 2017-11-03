// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DealerLocationSchema = new Schema({
  brand:{},
  dealer:{},
  location:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('DealerLocation', DealerLocationSchema);
