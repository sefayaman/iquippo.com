'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InvitationMasterSchema = new Schema({
  sDate:{type:Date,default:Date.now},
  eDate:Date,
  refAmount:{
    type: Number,
    default: 0
  },
  joinAmount:{
    type: Number,
    default: 0
  },
  key:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('InvitationMaster', InvitationMasterSchema);