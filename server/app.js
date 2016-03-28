/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var path    = require('path');
var fs      = require('fs');
var multer = require('multer');
//var upload = multer({ dest: config.uploadPath});
//var nodemailer = require('nodemailer'); 
var email = require('./components/sendEmail.js');
var sms = require('./components/sms.js');
var notification = require('./components/notification.js');
var checkExpiryService = require('./components/checkExpiry.js');
var http = require('http');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

// Setup server
var app = express();
var server = require('http').createServer(app);

require('./config/express')(app);
require('./routes')(app);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, req.uplPath);
  },
  filename: function (req, file, cb) {
    var arr = file.originalname.split(".");
    var extPart = arr[arr.length - 1];
    arr.splice(arr.length - 1,1);
    var namePart = arr.join('_');
    var nameArr = namePart.split(" ");
    var fName = nameArr.join('_');
    console.log(Math.floor(Math.random() * 100));
    cb(null, fName+"_"+Math.floor(Math.random() * 100) + "." + extPart);
  }
});

var upload = multer({ storage: storage}).any();

app.post('/api/uploads',function(req,res){
  var assetDir = req.query.assetDir;
  if(!assetDir)
    assetDir = new Date().getTime();
  var relativePath = config.uploadPath + assetDir +"/";
  checkDirectorySync(relativePath);
  req.uplPath = relativePath;
  upload(req,res,function(err,data) {
    if(err) {
      return res.end("Error uploading file.");
    }
    res.status(200).json({assetDir:assetDir,filename:req.files[0].filename});
  });
});

app.post('/api/multiplefile/upload',function(req,res){
  var assetDir = req.query.assetDir;
  if(!assetDir)
    assetDir = new Date().getTime();
  var relativePath = config.uploadPath + assetDir +"/";
  checkDirectorySync(relativePath);
  req.uplPath = relativePath;
  upload(req,res,function(err) {
    if(err) {
      return res.end("Error uploading file.");
    }
    res.status(200).json({assetDir:assetDir,files:req.files});
  });
});

var otp;
app.post('/api/sms',function(req,res){
    otp = '';
  var data = {};
  data.to = req.body.mobile; // 9555987870;
  data.content = req.body.content;
  sms.sendSMS(data,req,res);
  return res.status(200).send('');

});

app.post('/api/notification',function(req,res){
   notification.create(req,res);
});
app.post('/api/emailer',function(req,res){
   notification.emailer(req,res);
});


app.post('/api/currency',function(req,response){
    var url = "http://api.fixer.io/latest?base=RUB";
    http.get(url, function (res) {
     var str = "";
      res.on('data', function (chunk){
          str += chunk;
       });
       res.on('end', function () {
          response.end(str);
     });
  
  });

});

function checkDirectorySync(directory) {  
  try {
    fs.statSync(directory);
  } catch(e) {
    fs.mkdirSync(directory);
  }
}

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  notification.startNotification();
  checkExpiryService.start();
});

// Expose app
exports = module.exports = app;
