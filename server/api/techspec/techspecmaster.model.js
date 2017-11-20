// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TechSpecFieldMasterSchema = new Schema({
  /*category:{
    data:{type:Schema.Types.ObjectId,ref:'Category'},
    name:String
  },
  fields:[{}],*/
  categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
  categoryName:String,
  fieldName:String,
  fieldType:{type:String, default:'text'},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('TechSpecFieldMaster', TechSpecFieldMasterSchema);
