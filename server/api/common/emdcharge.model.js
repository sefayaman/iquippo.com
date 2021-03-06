'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var emdChargeSchema = new Schema({
  user:{
      userId: {type:Schema.Types.ObjectId,ref:'User'},
      mobile: String,
      name: String,  
     },
  userRole:String,
  enterpriseId:String,
  category:{
          categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
          name:String
          },
  emdCharge:Number,
  status:{type:String,default:'active'},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('emdCharge', emdChargeSchema);