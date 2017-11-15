// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TechSpecValueMasterSchema = new Schema({
  /*category:{
    data:{type:Schema.Types.ObjectId,ref:'Category'},
    name:String
  },
  brand:{
    data:{type:Schema.Types.ObjectId,ref:'Brand'},
    name:String
  },
  model:{
    data:{type:Schema.Types.ObjectId,ref:'Model'},
    name:String
  },
  fields:[{
    type:String,
    name:String,
    value:String
  }],*/
  categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
  categoryName:String,
  brandId:{type:Schema.Types.ObjectId,ref:'Brand'},
  brandName:String,
  modelId:{type:Schema.Types.ObjectId,ref:'Model'},
  mName:String,
  fieldId:{type:Schema.Types.ObjectId,ref:'TechSpecMaster'},
  fieldType:String,
  fieldName:String,
  fieldValue:String,
  isFront:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('TechSpecValueMaster', TechSpecValueMasterSchema);
