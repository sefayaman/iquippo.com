'use strict';

var _ = require('lodash');
var trim = require('trim');
var AuctionMaster = require('./auctionmaster.model');
var UserRegForAuctionModel = require('./userregisterforauction.model');
var PaymentModel = require('./../payment/payment.model');
var cache = require('memory-cache');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var ApiError = require('./../../components/_error.js');
var config = require('./../../config/environment');
var async = require('async');
var debug = require('debug')('api.auctionkit');
var moment = require('moment');
var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var fs = require('fs');
var path = require('path');
var registartion_cache_prefix = "registrationtemplate";
var undertaking_cache_prefix = "undertakingtemplate";
var cache_ttl = 1000*60*60*24*7;

exports.generateKit = function(req,res){
  var bodyData = req.body;
  if(!bodyData.auctionId || !bodyData.transactionId || !bodyData.userId)
    return res.status(412).send("Invalid kit generation request");
  AuctionMaster.find({_id:bodyData.auctionId},function(err,aucData){
    if(err) return handleError(res,err);
    if(!aucData || !aucData.length)
      return res.status(404).send("Auction not found");
    if(!aucData[0].registrationTemplate || !aucData[0].undertakingTemplate)
      return res.status(404).send("Registration or undertaking form template is not found");
    req.auctionData = aucData[0];
    async.parallel([generateRegistrationKit,generateUndertakingKit],onKitGenerated);
  });

  function onKitGenerated(err){
    if(err)
      return handleError(res,err);
    var transactionData = {
      registrationKit:req.regKitName,
      undertakingKit:req.undKitName
    };

    PaymentModel.update({_id:bodyData.transactionId},{$set:transactionData},function(errRes){
      if(err) return handleError(res,errRes);
      UserRegForAuctionModel.update({transactionId:bodyData.transactionId},{$set:transactionData}).exec();
      return res.status(200).send("Registartion and undertakit kit generated successfully");
    });
  }
  
 function generateRegistrationKit(callback){
      var tplContent = cache.get(registartion_cache_prefix+"_" + bodyData.auctionId);
      if(!tplContent){
        downloadFile(req.auctionData.registrationTemplate,function(err,resCont){
          cache.put(registartion_cache_prefix+"_" + bodyData.auctionId,resCont,cache_ttl);
          generateKit(req.auctionData,resCont,onRegComplete);
        });
        return;
      }else
        generateKit(req.auctionData,tplContent,onRegComplete);

    function onRegComplete(err,buff){
      if(err)
        return callback(err);
      var arr = req.auctionData.registrationTemplate.split(".");
      var extPart = arr[arr.length - 1];
       arr.splice(arr.length - 1, 1);
      var namePart = arr.join('_');
      var fileName = namePart + "_" + new Date().getTime() + "." + extPart;
      try{
        fs.writeFileSync(config.uploadPath + "auction/" + fileName, buff);
        uploadFile(fileName,function(err){
          req.regKitName = fileName;
          return callback(err)
        });
      }catch(err){
         return callback(err);
      }
    }

 }



function generateUndertakingKit(callback){
  var tplContent = cache.get(undertaking_cache_prefix+"_" + bodyData.auctionId);
  if(!tplContent){
    downloadFile(req.auctionData.undertakingTemplate,function(err,resCont){
      cache.put(undertaking_cache_prefix+"_" + bodyData.auctionId,resCont,cache_ttl);
      generateKit(req.auctionData,resCont,onUndertakingComplete);
    });
    return;
  }else
    generateKit(req.auctionData,tplContent,onUndertakingComplete);

   function onUndertakingComplete(err,buff){
      if(err)
        return callback(err);
      var arr = req.auctionData.undertakingTemplate.split(".");
      var extPart = arr[arr.length - 1];
       arr.splice(arr.length - 1, 1);
      var namePart = arr.join('_');
      var fileName = namePart + "_" + new Date().getTime() + "." + extPart;
      try{
        fs.writeFileSync(config.uploadPath + "auction/" + fileName, buff);
        uploadFile(fileName,function(err){
          req.undKitName = fileName;
          return callback(err)
        });
      }catch(err){
         return callback(err);
      }
    }

}

function downloadFile(file,cb){
      var opts = {
        localFile: config.uploadPath + "auction/" + file,
        key: "assets/uploads/auction/" + file
      };

      Utility.downloadFileFromS3(opts, function(err, s3res) {
        if (err) {
          debug(err);
          return cb(err);
        }

        try{
          var content = fs.readFileSync(config.uploadPath + "auction/" + file, 'binary');
          return cb(null,content);
        }catch(ex){
          return cb(ex);
        }
        
      });
  }

  function uploadFile(file,cb){
      var opts = {
        localFile: config.uploadPath + "auction/" + file,
        key: "assets/uploads/auction/" + file,
      };
      var files = [{
        path:config.uploadPath + "auction/" + file
      }];
      Utility.uploadMultipartFileOnS3(opts.localFile,opts.key,files,function(err, s3res) {
        return cb(err);
      });
  }
};

function generateKit(data,tplContent,cb){
  
  try {
      var zip = new JSZip(tplContent);
      var doc = new Docxtemplater();
      doc.loadZip(zip);
      doc.setData(data);
      doc.render();
      var buf = doc.getZip().generate({type: 'nodebuffer'});
      return cb(null,buf);
  }
  catch (error) {
      var e = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          properties: error.properties,
      }
      console.log(JSON.stringify({error: e}));
      return cb(e);
  }
}

/* end of auctionmaster */
function handleError(res, err) {
  console.log("err",err);
  return res.status(500).send(err);
}
