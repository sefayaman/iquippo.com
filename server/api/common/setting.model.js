'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AppSettingSchema = new Schema({
  key: String,
  value: String
});

module.exports = mongoose.model('AppSetting', AppSettingSchema);