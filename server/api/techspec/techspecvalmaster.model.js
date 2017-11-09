// 'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TechSpecValuedMasterSchema = new Schema({
  category:{
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
  }],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('TechSpecValuedMaster', TechSpecValuedMasterSchema);
