'use strict';

var bulkProductUpload = {};

var fs = require('fs');
var fsExtra = require('fs.extra');
// var gm = require('gm');
gm = require('gm').subClass({imageMagick: true});
var AdmZip = require('adm-zip');
var config = require('./../config/environment');
var IncomingProduct = require('./incomingproduct.model');
var Product = require('./../api/product/product.model');

bulkProductUpload.commitProduct = function(taskData,cb){
  var filename = taskData.taskInfo.filename;
  var zip = new AdmZip(config.uploadPath + "temp/" + filename);
  taskData.zip = zip;
  var zipEntries = zip.getEntries();
  var zipEntryObj = {};
  zipEntries.forEach(function(zipEntry){
    if(!zipEntry.isDirectory){
      var entryName = zipEntry.entryName;
      var entryNameParts = entryName.split('/');
        var assetId = entryNameParts[entryNameParts.length - 2];
        if(!zipEntryObj[assetId]){
          zipEntryObj[assetId] = [];
        }
        var obj = {};
        obj.name = zipEntry.name;
        obj.entryName = zipEntry.entryName;
        zipEntryObj[assetId].push(obj);
    }
   });
    var  keys = Object.keys(zipEntryObj);
    taskData.uploadedProducts = [];
    getProduct(keys,zipEntryObj,taskData,cb);
}

function getProduct(assetIds,zipEntryObj,taskData,cb){
    if(assetIds.length > 0){
      var assetId = assetIds[0];
      IncomingProduct.findOneAndUpdate({assetId:assetId,'user._id':taskData.user._id,lock:{$ne:true}},{ $set: {lock:true}},function(err,incPrd){
        if(err || !incPrd){
            assetIds.splice(0,1);
            getProduct(assetIds,zipEntryObj,taskData,cb);
          }else{
              extractEntryAndMapImages(assetIds,incPrd,zipEntryObj,taskData,cb);            
          }
      })      
    }else{
      try{
        fs.unlink(config.uploadPath + "temp/" + taskData.taskInfo.filename);
      }catch(e){
        console.log('error in deleting file',e);
      }
      cb(true,taskData);
    }
}

function extractEntryAndMapImages(assetIds,product,zipEntryObj,taskData,cb){
  var ret = false;
   try{
       product.images = [];
       product.assetDir = new Date().getTime();
       zipEntryObj[assetIds[0]].forEach(function(item,index){
          if(item.name.match(/\.(jpg|jpeg|png)$/) && index < 8){
            taskData.zip.extractEntryTo(item.entryName,config.uploadPath + "/" + product.assetDir + "/" ,false);
            var img = {};
            img.isPrimary = false;
            img.waterMarked = false;
            img.src = item.name;
            product.images.push(img);
          }
       });
       if(product.images.length > 0){
          product.primaryImg = product.images[0].src;
          product.images[0].isPrimary = true;
       }
       //product.assetDir = product.assetId;
       taskData.imgCounter = 0;
    }catch(e){
       IncomingProduct.update({_id:product._id},{$set:{lock:false}});
       console.log("error in extracting.",e);
       ret = true;
    }
    if(ret){
      assetIds.splice(0,1);
      getProduct(assetIds,zipEntryObj,taskData,cb);
      return;
    }
    placeWaterMark(assetIds,product,zipEntryObj,taskData,cb);
}

function placeWaterMark(assetIds,product,zipEntryObj,taskData,cb){
    if(taskData.imgCounter < product.images.length){
      var waterMarkWidth = 144;
      var waterMarkHeight = 86;
      try{
        var imgPath = config.uploadPath + product.assetDir + "/" + product.images[taskData.imgCounter].src;
        var imgRef = gm(imgPath);
        imgRef.size(function(err,val){
          if(err){
             console.log("error in getting detail",err);
             taskData.imgCounter ++;
             placeWaterMark(assetIds,product,zipEntryObj,taskData,cb);
          }else{
             var ptx = val.width - waterMarkWidth;
            var pty = val.height - waterMarkHeight;
            var args = 'image Over '+ ptx +','+ pty  +' 0,0 "' + config.uploadPath + '../images/watermark.png"';
            imgRef.draw([args])
            .write(imgPath, function(e){
              if(e){
                console.log('Error in placing watermark',e);  
              }else
                product.images[taskData.imgCounter].waterMarked = true;
              taskData.imgCounter ++;
              placeWaterMark(assetIds,product,zipEntryObj,taskData,cb);
            });
          }
        })
      }catch(e){
        console.log("exception------",e);
        taskData.imgCounter ++;
        placeWaterMark(assetIds,product,zipEntryObj,taskData,cb);
      }
    }else{
      commitProduct(assetIds,product,zipEntryObj,taskData,cb);        
    }
     
}

function commitProduct(assetIds,product,zipEntryObj,taskData,cb){
  IncomingProduct.remove({_id:product._id},function(err,dt){
    if(err){
        IncomingProduct.update({_id:product._id},{$set:{lock:false}});
        console.log("error in deleting product")
    }
    delete product._id;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    product.relistingDate = new Date();
    Product.create(product, function(err, prd) {
      if(err){console.log('error in creating product')}
      if(!err) taskData.uploadedProducts.push(product.assetId);
       assetIds.splice(0,1);
       getProduct(assetIds,zipEntryObj,taskData,cb);
    });
  })
}

module.exports = bulkProductUpload;
