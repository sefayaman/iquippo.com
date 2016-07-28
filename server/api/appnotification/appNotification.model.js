'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AppNotificationSchema = new Schema({
  user:{},
  product:{},
  notificationStatus: {
    type: Boolean,
    default: false
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AppNotification', AppNotificationSchema);
