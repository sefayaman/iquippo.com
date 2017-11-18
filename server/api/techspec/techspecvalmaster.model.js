// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TechSpecValueMasterSchema = new Schema({
  category:{
    categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
    name:String
  },
  brand:{
    brandId:{type:Schema.Types.ObjectId,ref:'Brand'},
    name:String
  },
  model:{
    modelId:{type:Schema.Types.ObjectId,ref:'Model'},
    name:String
  },
  fields:[{}],
  // fields:[{
  //   fieldId:{type:Schema.Types.ObjectId,ref:'TechSpecMaster'},
  //   type:String,
  //   name:String,
  //   value:String,
  //   isFront:{type:Boolean,default:false},
  // }],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('TechSpecValueMaster', TechSpecValueMasterSchema);
