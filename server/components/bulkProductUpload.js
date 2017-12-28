'use strict';

var bulkProductUpload = {};

var fs = require('fs');
var fsExtra = require('fs.extra');
var gm = require('gm').subClass({
  imageMagick: true
});
var AdmZip = require('adm-zip');
var config = require('./../config/environment');
var IncomingProduct = require('./incomingproduct.model');
var Product = require('./../api/product/product.model');
var Model = require('./../api/model/model.model');
var appNotificationCtrl = require('../api/appnotification/appnotification.controller');
var utility = require('./utility');

bulkProductUpload.commitProduct = function(taskData, cb) {
  var filename;
  if (taskData && taskData.taskInfo && taskData.taskInfo.filename) {
    filename = taskData.taskInfo.filename;
  } else {
    return cb(new Error('Invalid taskinfo/file'), taskData);
  }
  var zip = new AdmZip(config.uploadPath + "temp/" + filename);
  taskData.zip = zip;
  var zipEntries = zip.getEntries();
  var zipEntryObj = {};
  zipEntries.forEach(function(zipEntry) {
    if (!zipEntry.isDirectory) {
      var entryName = zipEntry.entryName;
      var entryNameParts = entryName.split('/');
      var assetId = entryNameParts[entryNameParts.length - 2];
      if (!zipEntryObj[assetId]) {
        zipEntryObj[assetId] = [];
      }
      var obj = {};
      obj.name = zipEntry.name;
      obj.entryName = zipEntry.entryName;
      zipEntryObj[assetId].push(obj);
    }
  });
  var keys = Object.keys(zipEntryObj);
  taskData.uploadedProducts = [];
  getProduct(keys, zipEntryObj, taskData, cb);
}

function getProduct(assetIds, zipEntryObj, taskData, cb) {
  if (assetIds.length > 0) {
    var assetId = assetIds[0];
    IncomingProduct.findOne({
      assetId: assetId//,
      //'user._id': taskData.user._id
    }, function(err, incPrd) {
      if (err || !incPrd) {
        assetIds.splice(0, 1);
        getProduct(assetIds, zipEntryObj, taskData, cb);
      } else {
        extractEntryAndMapImages(assetIds, incPrd, zipEntryObj, taskData, cb);
      }
    })
  } else {
    try {
      fs.unlink(config.uploadPath + "temp/" + taskData.taskInfo.filename);
    } catch (e) {
      console.log('error in deleting file', e);
    }
    cb(true, taskData);
  }
}

function extractEntryAndMapImages(assetIds, product, zipEntryObj, taskData, cb) {
  var ret = false;
  try {
    product.images = [];
    product.assetDir = new Date().getTime();
    zipEntryObj[assetIds[0]].forEach(function(item, index) {
      if (item.name.match(/\.(jpg|jpeg|png)$/i) && index < 8) {
        taskData.zip.extractEntryTo(item.entryName, config.uploadPath + "/" + product.assetDir + "/", false);
        var img = {};
        img.isPrimary = false;
        img.waterMarked = false;
        img.src = item.name;
        product.images.push(img);
      }
    });
    if (product.images.length > 0) {
      product.primaryImg = product.images[0].src;
      product.images[0].isPrimary = true;
    }
    //product.assetDir = product.assetId;
    taskData.imgCounter = 0;
  } catch (e) {
    /*IncomingProduct.update({
      _id: product._id
    }, {
      $set: {
        lock: false
      }
    }).exec();*/
    console.log("error in extracting.", e);
    ret = true;
  }
  if (ret) {
    assetIds.splice(0, 1);
    getProduct(assetIds, zipEntryObj, taskData, cb);
    return;
  }
  placeWaterMark(assetIds, product, zipEntryObj, taskData, cb);
}

function placeWaterMark(assetIds, product, zipEntryObj, taskData, cb) {

  if (taskData.imgCounter < product.images.length) {
    var waterMarkWidth = 144;
    var waterMarkHeight = 86;
    try {
      var imgPath = config.uploadPath + product.assetDir + "/" + product.images[taskData.imgCounter].src;
      var imgRef = gm(imgPath);
      imgRef.size(function(err, val) {
        if (err) {
          console.log("error in getting detail", err);
          taskData.imgCounter++;
          placeWaterMark(assetIds, product, zipEntryObj, taskData, cb);
        } else {
          var ptx = val.width - waterMarkWidth;
          var pty = val.height - waterMarkHeight;
          var args = 'image Over ' + ptx + ',' + pty + ' 0,0 "' + config.uploadPath + '../images/watermark.png"';
          imgRef.draw([args])
            .write(imgPath, function(e) {
              if (e) {
                console.log('Error in placing watermark', e);
              } else
                product.images[taskData.imgCounter].waterMarked = true;
              taskData.imgCounter++;
              placeWaterMark(assetIds, product, zipEntryObj, taskData, cb);
            });
        }
      })
    } catch (e) {
      console.log("exception------", e);
      taskData.imgCounter++;
      placeWaterMark(assetIds, product, zipEntryObj, taskData, cb);
    }
  } else {
    var localFilePath = config.uploadPath + product.assetDir;
    var dirName = product.assetDir;
    utility.uploadFileS3(localFilePath, dirName, function(err, data) {
      if (err) {
        console.log("Error : Moveing images directory to s3", err);
       /* IncomingProduct.update({
        _id: product._id
        }, {
          $set: {
            lock: false
          }
        }).exec();*/
        assetIds.splice(0, 1);
        getProduct(assetIds, zipEntryObj, taskData, cb);
        return;
        //return cb(true, taskData);
      }
      return commitProduct(assetIds, product, zipEntryObj, taskData, cb);
    });
  }
}

function commitProduct(assetIds, product, zipEntryObj, taskData, cb) {
  IncomingProduct.remove({
    _id: product._id
  }, function(err, dt) {
    if (err) {
      /*IncomingProduct.update({
        _id: product._id
      }, {
        $set: {
          lock: false
        }
      }).exec();*/
      console.log("error in deleting product");
      assetIds.splice(0, 1);
      getProduct(assetIds, zipEntryObj, taskData, cb);
      return;
    }
    product = product.toObject();
    delete product._id;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    product.relistingDate = new Date();
    Product.create(product, function(err, prd) {

      if (err) {
        console.log('error in creating product');
      }
      if (!err) taskData.uploadedProducts.push(product.assetId);
      //create app notificaton data
      appNotificationCtrl.createAppNotification(product);

      assetIds.splice(0, 1);
      getProduct(assetIds, zipEntryObj, taskData, cb);
    });
  })
}

bulkProductUpload.updateProductMaster = function(req, res) {
  Model.find({
    'group.name': "Other",
    'category.name': "Other",
    'brand.name': "Other",
    name: "Other"
  }, function(err, models) {
    if (err) {
      return res.status(500).send(err);
    }
    if (models.length == 0)
      return res.status(404).send("Other model not found");
    if (models.length > 1)
      return res.status(404).send("More than one model found");
    var query = Product.find({
      $or: [{
        "brand.name": /^Other/i
      }, {
        "category.name": /^Other/i
      }, {
        "model.name": /^Other/i
      }],
      deleted: false
    });
    query.exec(function(err, products) {
      if (err) {
        return res.status(500).send(err);
      }
      req.counter = 0;
      req.total = products.length;
      req.model = models[0];
      updateProducts(req, res, products);
    })

  })
}

function updateProducts(req, res, products) {
  if (req.counter < req.total) {
    var prd = products[req.counter];
    var id = prd._id;
    delete prd._id;
    var flag = -1;
    if (prd.category.name == "Others" || prd.category.name == "Other")
      flag = 1;
    else if (prd.brand.name == "Others" || prd.brand.name == "Other")
      flag = 2;
    else if (prd.model.name == "Others" || prd.model.name == "Other")
      flag = 3;
    else {
      req.counter++;
      updateProducts(req, res, products);
      return;
    }

    switch (flag) {
      case 1:
        prd.category._id = req.model.category._id;
        prd.category.name = req.model.category.name;
        if (!prd.category.otherName)
          prd.category.otherName = "Others";
        prd.group = req.model.group;
      case 2:
        var brName = prd.brand.name;
        prd.brand._id = req.model.brand._id;
        prd.brand.name = req.model.brand.name;
        if (!prd.brand.otherName)
          prd.brand.otherName = brName != "Others" && brName != "Other" ? brName : "Others";
      case 3:
        var mdName = prd.model.name;
        prd.model._id = req.model._id;
        prd.model.name = req.model.name;
        if (!prd.model.otherName)
          prd.model.otherName = mdName != "Others" && mdName != "Other" ? mdName : "Others";
        break;
    }

    if (prd.category.name == "Other")
      prd.name = prd.category.otherName || "";
    else
      prd.name = prd.category.name || "";

    if (prd.brand.name == "Other")
      prd.name += " " + prd.brand.otherName || "";
    else
      prd.name += " " + prd.brand.name || "";

    if (prd.model.name == "Other")
      prd.name += " " + prd.model.otherName || "";
    else
      prd.name += " " + prd.model.name || "";
    if (prd.variant)
      prd.name += " " + prd.variant;

    Product.update({
      _id: id
    }, {
      $set: prd
    }, function(err, data) {
      if (err) {
        console.log("###", err)
      }
      req.counter++;
      updateProducts(req, res, products);
    })

  } else {
    return res.status(200).send("Done");
  }
}

module.exports = bulkProductUpload;