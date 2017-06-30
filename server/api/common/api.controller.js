'use strict';


var path = require('path');
var fs = require('fs');
var multer = require('multer');
var config = require('../../config/environment');
//var upload = multer({ dest: config.uploadPath});
//var nodemailer = require('nodemailer'); 
var http = require('http');
var fsExtra = require('fs.extra');
var gm = require('gm');
var lwip = require('lwip');

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, req.uplPath);
  },
  filename: function(req, file, cb) {
    var decodedFname = decodeURI(file.originalname);
    if (decodedFname.indexOf('%20') != -1)
      decodedFname = decodedFname.replace(/%20/g, '');
    var arr = decodedFname.split(".");
    var extPart = arr[arr.length - 1];
    arr.splice(arr.length - 1, 1);
    var namePart = arr.join('_');
    var nameArr = namePart.split(" ");
    var fName = nameArr.join('_');
    cb(null, fName + "_" + Math.floor(Math.random() * 100) + "." + extPart);
  }
});

var upload = multer({
  storage: storage
}).any();

function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch (e) {
    fs.mkdirSync(directory);
  }
}


exports.uploadZip=function(req, res) {
 var assetDir = 'tempZip';
  var childDir = 'y';
  var resize = req.query.resize;
  if (childDir == 'y' && assetDir) {
    var dirs = assetDir.split("/");
    if (dirs.length == 1)
      assetDir = assetDir + "/" + new Date().getTime();
  }

  if (!assetDir)
    assetDir = new Date().getTime();
  var relativePath = config.uploadPath + assetDir + "/";
  checkDirectorySync(relativePath);
  req.uplPath = relativePath;
  upload(req, res, function(err, data) {
    if (err) {
      return res.end("Error uploading file.");
    }
    if (resize == 'y') {
      var dimension = {};
      dimension.width = req.query.width;
      dimension.height = req.query.height;
      dimension.size=req.query.size;
      req.counter = 0;
      req.total = 1;
      resizeImg(req, res, assetDir, dimension, false);
    } else {
      try {
        res.status(200).json({
          assetDir: assetDir,
          filename: req.files[0].filename
        });
      } catch (err) {
        return res.end("Error uploading file.");
      }
    }

  });

};




function resizeImg(req, res, assetDir, dimension, isMultiple) {
  try {
    if (req.counter < req.total) {
      var fileName = req.files[req.counter].filename;
      var imgPath = config.uploadPath + assetDir + "/" + fileName;
      var fileNameParts = fileName.split('.');
      var extPart = fileNameParts[fileNameParts.length - 1];
      var namePart = fileNameParts[0];
      var originalFilePath = config.uploadPath + assetDir + "/" + namePart + "_original." + extPart;
      fsExtra.copy(imgPath, originalFilePath, {
        replace: true
      }, function(err, result) {
        if (err) throw err;
        if(dimension.size > 50000){
        lwip.open(imgPath, function(err, image) {
          console.log("-----image",image);
          //var wRatio = 700 / image.width();
          //var hRatio= 450 / image.height();
          image.scale(0.75, function(err, rzdImage) {
            if (extPart === 'jpg' || extPart === 'jpeg') {
              rzdImage.toBuffer(extPart, {
                quality: 85
              }, function(err, buffer) {
                fs.writeFile(imgPath, buffer, function(err) {
                  if (err) throw err;
                  req.counter++;
                });
              });
              resizeImg(req, res, assetDir, dimension, isMultiple);
            } else {
              if (extPart == 'png') {
                rzdImage.toBuffer(extPart, {
                  compression: "high",
                  interlaced: false,
                  transparency: 'auto'
                }, function(err, buffer) {
                  fs.writeFile(imgPath, buffer, function(err) {
                    if (err) throw err;
                    req.counter++;
                  });
                });
                return resizeImg(req, res, assetDir, dimension, isMultiple);
              }
            }
          });
        });
    }
    else{
      req.counter++;
      resizeImg(req, res, assetDir, dimension, isMultiple);
    }
      });

    } else {
      if (isMultiple) {
        res.status(200).json({
          assetDir: assetDir,
          files: req.files
        });
      } else {
        res.status(200).json({
          assetDir: assetDir,
          filename: req.files[0].filename
        });
      }
    }
  } catch (err) {
    handleError(res, err);
  }
}

function handleError(res, err) {
  return res.status(500).send(err);
}








