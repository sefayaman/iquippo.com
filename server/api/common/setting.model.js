'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AppSettingSchema = new Schema({
  key: String,
  value: String,
  valueObj:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AppSetting', AppSettingSchema);