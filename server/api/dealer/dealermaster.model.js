// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DealerLocationSchema = new Schema({
  brand:{
    data:{type:Schema.Types.ObjectId,ref:'Brand'},
    name:String
  },
  dealer:{
    data:{type:Schema.Types.ObjectId,ref:'Vendor'},
    name:String
  },
  country:String,
  state:[{
    data:{type:Schema.Types.ObjectId,ref:'State'},
    name:String
  }],
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('DealerLocation', DealerLocationSchema);
