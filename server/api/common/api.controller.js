'use strict';

var async = require('async');
var path = require('path');
var fs = require('fs');
var multer = require('multer');
var config = require('../../config/environment');
var AdmZip = require('adm-zip');
var EnterpriseValuation = require('../enterprise/enterprisevaluation.model');

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


exports.uploadZip = function(req, res, next) {
  var data = req.query;
  var dataToSave = {};
  dataToSave.uniqueControlNo = data.uniqueControlNo;
  /*if (!data.uniqueControlNo)
    return res.status(404).send("Unique control number is required");*/
  var assetDir = "";
  var zipfilePath = "";
  EnterpriseValuation.find({
    uniqueControlNo: data.uniqueControlNo,
    deleted: false
  }, function(err, results) {
    if (err) {
      return handleError(res, err);
    }
    if (!results.length)
      return res.status(404).send("Unique control number is not found");
    if (results && results[0].assetDir) {
      assetDir = results[0].assetDir;
    } else {
      assetDir = new Date().getTime();
    }

    var relativePath = config.uploadPath + "temp/";
    checkDirectorySync(relativePath);
    req.uplPath = relativePath;
    upload(req, res, function(err, data) {
      if (err) {
        return handleError(res, err);
      }
      console.log("Saved in Directory", assetDir);
      var images = [];

      function extractZipFile(callback) {
        fs.readdir(relativePath, function(err, files) {
          if (err) {
            return handleError(res, err);
          }
          var zip = new AdmZip(relativePath + files[0]);
          zipfilePath = config.uploadPath + "temp" + '/' + files[0];
          var zipEntries = zip.getEntries();
          zipEntries.forEach(function(zipFile) {
            var img = {};
            var path = zipFile.entryName.split('/');
            if (zipFile.entryName.match(/\.(jpg|jpeg|png)$/i)) {
              zip.extractEntryTo(zipFile.entryName, config.uploadPath + assetDir + '/', false,true);
              switch (path[1]) {
                case 'engine':
                  img.catImgType = "eP";
                  img.src = path[path.length - 1];
                  break;
                case 'hydraulic':
                  img.catImgType = "hP";
                  img.src = path[path.length - 1];
                  break;
                case 'cabin':
                  img.catImgType = "cP";
                  img.src = path[path.length - 1];
                  break;
                case 'underCarriage':
                  img.catImgType = "uC";
                  img.src = path[path.length - 1];
                  break;
                case 'other':
                  img.catImgType = "oP";
                  img.src = path[path.length - 1];
                  break;
                case 'general':
                  img.catImgType = "gP";
                  img.src = path[path.length - 1];
                  break;
              }
              images.push(img);
            }
          });
          dataToSave.images = images;
          try {
            console.log("zipfile",zipfilePath);
            fs.unlink(zipfilePath);
          } catch (e) {
            console.log('error in deleting file', e);
          }
          return callback();
        });
      }

      function saveToDatabase(callback) {
        EnterpriseValuation.update({
          uniqueControlNo: dataToSave.uniqueControlNo
        }, {
          $set: {
            images: dataToSave.images,
            assetDir: assetDir
          }
        }, function(err, data) {
          if (err) {
            return handleError(res, err);
          }
        });
        return callback();
      }

      async.series([extractZipFile, saveToDatabase], function(err, results) {
        if (err) throw err;

        return res.status(200).send("succesfully Updated");
      });

    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}