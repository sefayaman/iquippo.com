'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AppNotificationSchema = new Schema({
  user:{},
  message: String,
  notificationFor:String,
  imgsrc: String,
  status: {
    type: String,
    default: 'unread'
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('AppNotification', AppNotificationSchema);
