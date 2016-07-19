'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SaveSearch = new Schema({
  text: String,
  user:{},
  emailNotification:{
    type: Boolean,
    default: false
  },
  notifyCounter: {
    type: Number,
    default: 0
  },
  checkSendMailDate: {type:Date,default:Date.now},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('SaveSearch', SaveSearch);