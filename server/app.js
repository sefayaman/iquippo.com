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
var checkQuickQueryNotificationService = require('./components/checkQuickQueryNotification.js');
var checkSearchMatchingNotificationService = require('./components/checkSearchMatchingNotification.js');
var http = require('http');
var fsExtra = require('fs.extra');
 var gm = require('gm');
 var task = require('./components/task.js');
  var taskRunner = require('./components/taskRunner.js');


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
     var decodedFname = decodeURI(file.originalname);
    if(decodedFname.indexOf('%20') != -1)
      decodedFname = decodedFname.replace(/%20/g,'');
   // var arr = decodeURI(file.originalname).split(".");
   var arr = decodedFname.split(".");
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
  var resize = req.query.resize;
  if(!assetDir)
    assetDir = new Date().getTime();
  var relativePath = config.uploadPath + assetDir +"/";
  checkDirectorySync(relativePath);
  req.uplPath = relativePath;
  upload(req,res,function(err,data) {
    if(err) {
      return res.end("Error uploading file.");
    }
    if(resize == 'y'){
      var dimension = {};
      dimension.width = req.query.width;
      dimension.height = req.query.height;
      req.counter = 0;
      req.total = 1;
      resizeImg(req,res,assetDir,dimension,false)
    }
    else{
       res.status(200).json({assetDir:assetDir,filename:req.files[0].filename});
    }

  });
});

app.post('/api/multiplefile/upload',function(req,res){
  var assetDir = req.query.assetDir;
  var resize = req.query.resize;
  if(!assetDir)
    assetDir = new Date().getTime();
  var relativePath = config.uploadPath + assetDir +"/";
  checkDirectorySync(relativePath);
  req.uplPath = relativePath;
  upload(req,res,function(err) {
    if(err) {
      return res.end("Error uploading file.");
    }
     if(resize == 'y'){
        var dimension = {};
        dimension.width = req.query.width;
        dimension.height = req.query.height;
        req.counter = 0;
        req.total = req.files.length;
        resizeImg(req,res,assetDir,dimension,true);
     }
      else
        res.status(200).json({assetDir:assetDir,files:req.files});
  });
});

function resizeImg(req,res,assetDir,dimension,isMultiple){
  try{
      if(req.counter < req.total){
          var fileName = req.files[req.counter].filename;
          var imgPath = config.uploadPath + assetDir +"/" + fileName;
          var imgRef = gm(imgPath);
          imgRef.identify(function(err,val){
          var resizeToW = dimension.width;
          var resizeToH = dimension.height; 

          if(val.size && val.size.width <= dimension.width)
            resizeToW = null;
          if(val.size && val.size.height <= dimension.height)
            resizeToH = null;
          if(!resizeToW && !resizeToH){
            req.counter ++;
            resizeImg(req,res,assetDir,dimension,isMultiple);
          }else{
                var fileNameParts = fileName.split('.');
                var extPart = fileNameParts[fileNameParts.length -1];
                var namePart = fileNameParts[0];
                var originalFilePath = config.uploadPath + assetDir + "/" + namePart +"_original." + extPart;
                fsExtra.copy(imgPath,originalFilePath,function(err,result){
                    imgRef.resize(resizeToW,resizeToH,"!")
                    .write(imgPath, function(e){
                        req.counter ++;
                        resizeImg(req,res,assetDir,dimension,isMultiple);
                    });
                });
          }
        })

      }else{
        if(isMultiple){
            res.status(200).json({assetDir:assetDir,files:req.files});
        }else{
            res.status(200).json({assetDir:assetDir,filename:req.files[0].filename});
        }
      }
  }catch(err){
    handleError(res, err);
  }
}

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

app.post('/api/createtask',function(req,res){
   task.create(req,res);
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

function handleError(res, err) {
  return res.status(500).send(err);
}

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  notification.startNotification();
  taskRunner.startTaskRunner();
  checkExpiryService.start();
  checkQuickQueryNotificationService.start();
  checkSearchMatchingNotificationService.start();
});

// Expose app
exports = module.exports = app;
