'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var email = require('./sendEmail.js');
var sms = require('./sms.js');
var User = require('./../api/user/user.model');

var notificationSchema = new Schema({
  notificationType: String,
  from: String,
  to: String,
  cc: String,
  subject: String,
  content: String,
  countryCode: String,
  counter: Number,
  document: String,
  isSent: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// on every save, add the date
notificationSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();

  // change the updated_at field to current date
  this.updatedAt = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.createdAt)
    this.createdAt = currentDate;

  next();
});

notificationSchema.index({
  notificationType: 1,
  from: 1,
  to: 1,
  cc: 1,
  subject: 1,
  isSent: 1
}, {
  unique: true,
  name: "unique_email"
});

var notification = mongoose.model('Notification', notificationSchema, 'notification');

notification.on('index', function(err) {
    if (err) {
        console.error('Notification index error: %s', err);
    } else {
        console.info('Notification indexing complete');
    }
});

exports.create = function(req, res) {
  var data = req.body;
  if (data.notificationType == 'email') {
    delete data.countryCode;
  }
  data['counter'] = 0;
  data.isSent = false;
  notification.create(req.body, function(err, data) {
    if (err) {
      return handleError(res, err);
    } else
      return res.status(200).json(data);
  });
}

/*exports.emailer = function(req,res){
  var mailData = req.body;
  var userTypeArr = [];
 
  if(mailData.ind)
    userTypeArr[userTypeArr.length] = "individual";
   if(mailData.pe)
    userTypeArr[userTypeArr.length] = 'private';
   if(mailData.le)
    userTypeArr[userTypeArr.length] = 'legalentity';
  User.find({userType:{$in:userTypeArr}},function(err,users){
    if(err) { return handleError(res, err); }
    if(users.length == 0)
    {
      return res.status(200).json({errorCode:1,message:"No recipient found"});
    }
    var data = {};
    data.subject = mailData.subject;
    data.content = "<head><meta charset='utf-8' content='width=divice-width, initial-screen=1'/></head><body>" + mailData.content +"<body>";
    data.counter = 0;
    data.notificationType = "email";
    if(mailData.document)
      data.document = mailData.document;
    data.createdAt = new Date();
     req.counter = 0;
     console.log("email users:", users);
    req.users = users;
    createEmail(req,res,data);
   
  });
}*/

exports.emailer = function(req, res) {
  var mailData = req.body;
  var data = {};
  data.subject = mailData.subject;
  data.content = "<head><meta charset='utf-8' content='width=divice-width, initial-screen=1'/></head><body>" + mailData.content + "<body>";
  data.counter = 0;
  data.notificationType = "email";
  if (mailData.document)
    data.document = mailData.document;
  req.counter = 0;
  req.users = mailData.allToEmails;
  createEmail(req, res, data);
}

function createEmail(req, res, data) {
  if (req.counter < req.users.length) {
    data.to = req.users[req.counter];
    data.isSent = false;
    notification.create(data, function(err, dt) {
      if (err) {
        return handleError(res, err);
      } else {
        req.counter++;
        createEmail(req, res, data)
      }
    });
  } else {
    res.status(200).json({
      errorCode: 0,
      message: ""
    });;
  }
}

exports.pushNotification = function(data, cb) {
  data['counter'] = 0;
  data.isSent = false;
  notification.create(data, function(err, data) {
    if (err) {
      if (cb)
        cb(false)
      else
        console.log(err);
    } else {
      if (cb)
        cb(true);
    }
  });
}

function handleError(res, err) {
  //console.log("-------",err)
  return res.status(500).send(err);
}

function getNotifications() {
  notification.find({
    counter: {
      $lte: 3
    },
    createdAt: {
      $lt: new Date()
    }
  }).limit(1).exec(function(err, data) {
    if (err) {
      return console.log(err);
      setTimeout(function() {
        getNotifications();
      }, 5000); //sleep 
    } else {
      // console.log( "got data "+ data.length);
      sendNotification(data);
    }
  });
}

function sendNotification(data) {
  try {
    if (data && data.length > 0) {
      var notificationType = data[0].notificationType;
      var fn = null;
      if (notificationType == 'sms')
        fn = sms.autoSMS
      else
        fn = email.autoMail;
      fn(data[0], function(result) {
        updateNotification(result, data);
      });
    } else {
      setTimeout(function() {
        getNotifications();
      }, 5000); //sleep
    }
  } catch (ex) {
    console.log("Error in send notification");
    console.log(ex);
  }
}

function updateNotification(result, data) {
  if (result) {
    notification.findOneAndUpdate({
      _id: data[0]._id
    }, {
      counter : 7
    }, function(err) {
      if (err) {
        console.log("Error with updating notification");
      }
      data.shift();
      sendNotification(data);
    });
  } else {
    notification.findOneAndUpdate({
      _id: data[0]._id
    }, {
      counter: parseInt(data[0].counter) + 1
    }, function(err) {
      if (err) {
        console.log("Error with updating notification");
      }
      data.shift();
      sendNotification(data);
    })
  }

}

exports.startNotification = function() {
  console.log("notification service started");
  getNotifications();
}