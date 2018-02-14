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
var mongo = require('mongodb');
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
    
    UserRegForAuctionModel.find({"auction.dbAuctionId":bodyData.auctionId},function(err,userData){
        if (userData.length) {
            req.userData = userData[0];
        }
    });
    var payObjId = new mongo.ObjectID(bodyData.transactionId);
    PaymentModel.find({"_id":payObjId},function(err,paymentData){
        if (paymentData.payments) {
            req.paymentData = paymentData[0].payments[0];
        }
    });
      
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
          generateKit(req.auctionData,req.paymentData,req.userData,resCont,onRegComplete);
        });
        return;
      }else
        generateKit(req.auctionData,req.paymentData,req.userData,tplContent,onRegComplete);

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
      generateKit(req.auctionData,req.paymentData,req.userData,resCont,onUndertakingComplete);
    });
    return;
  }else
    generateKit(req.auctionData,req.paymentData,req.userData,tplContent,onUndertakingComplete);

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
var Export_Data_Field = {
  "startDate" : "startDate",
  "city" : "city",
  "userName" : "userName",
//  "attendee" : "attendee",
  "mobile" : "mobile",
  "batonNo" : "batonNo",
  "email" : "email",
  "bidderAddress" : "bidderAddress",
  "pinCode" : "pinCode",
  "panNumber" : "panNumber",
  "kycInfo" : "kycInfo",
  "payee" : "payee",
  "depositAmount" : "depositAmount",
  "cash" : "cash",
  "bankName" : "bankName",
  "refNo" : "refNo",
  "paymentDate" : "paymentDate",
  "neftRtgsNo":"neftRtgsNo",
  "buyerName":"buyerName",
  "buyerAge":"buyerAge",
  "buyerAdd":"buyerAdd",
  "bidCardNo":"bidCardNo",
  "buyerContactNo":"buyerContactNo"
};
function generateKit(data,paymentData,userData,tplContent,cb){
    var headers = Object.keys(Export_Data_Field);
    var setDataValue = {} ; 
    //console.log(paymentData); return;
    headers.forEach(function (header) {
        //console.log(header); 
        if(header==='startDate') {
            setDataValue.startDate = moment(data.startDate).utcOffset('+0530').format('MM/DD/YYYY');
        }
        else if (header==='city') {
            setDataValue.city = _.get(data, 'city', '');
        }
        else if (header==='userName') {
            setDataValue.userName = _.get(userData.user, "fname", "") + " " + _.get(userData.user, "lname", "");
        }
        else if (header==='mobile') {
            setDataValue.mobile = _.get(userData.user, "mobile", "");
        }
        else if (header==='batonNo') {
            setDataValue.batonNo = _.get(userData.user, "batonNo", "");
        }
        else if (header==='email') {
            setDataValue.email = _.get(userData.user, "email", "");
        }
        else if (header==='bidderAddress') {
            setDataValue.bidderAddress = _.get(userData.user, "state", "") + " "+ _.get(userData.user, "city", "") + " "+ _.get(userData.user, "country", "");
        }
        else if (header==='pinCode') {
            setDataValue.pinCode = _.get(userData.user, "pinCode", "");
        }
        else if (header==='panNumber') {
            setDataValue.panNumber = _.get(userData.user, "panNumber", "");
        }
        else if (header==='kycInfo') {
            setDataValue.kycType = _.get(userData.user, "type", "");
            setDataValue.kycName = _.get(userData.user, "name", "");
        }
        else if (header==='payee') {
            setDataValue.payee = _.get(userData.user, "fname", "") + " " + _.get(userData.user, "lname", "");
        }
        
        else if (header==='depositAmount') {
          if (paymentData) {
            setDataValue.depositAmount = _.get(paymentData, "amount", "");
          }
          else setDataValue.depositAmount = '';
        }
        else if (header==='cash') {
          if(paymentData && paymentData.paymentModeType==='Cash'){
            setDataValue.cash = 'Cash';
          }
          else
            setDataValue.cash = '';  
        }
        else if (header==='bankName') {
          if (paymentData) {
            setDataValue.bankName = _.get(paymentData, "bankname", "");
          }
          else setDataValue.bankName = '';
        }
        else if (header==='refNo') {
          if (paymentData) {
            setDataValue.refNo = _.get(paymentData, "refNo", "");
          }
          else setDataValue.refNo = '';
        }
        else if (header==='paymentDate') {
          if (paymentData) {
            setDataValue.paymentDate = moment(paymentData.paymentDate).utcOffset('+0530').format('MM/DD/YYYY');
          }
          else setDataValue.paymentDate = '';
        }
        else if (header==='neftRtgsNo') {
          if (paymentData) {
            setDataValue.neftRtgsNo = _.get(paymentData, "neftRtgsNo", "");
          }
          else setDataValue.neftRtgsNo = '';
        }
        
        else if (header==='buyerName') {
            setDataValue.buyerName = _.get(userData.user, "fname", "") + " " + _.get(userData.user, "lname", "");
        }
        else if (header==='buyerAge') {
            setDataValue.buyerAge = _.get(userData.user, "buyerAge", "") ;
        }
        else if (header==='buyerAdd') {
            setDataValue.buyerAdd = setDataValue.bidderAddress = _.get(userData.user, "bidderAddress", "");
        }
        else if (header==='bidCardNo') {
            setDataValue.bidCardNo = _.get(userData.user, "batonNo", "");
        }
        else if (header==='buyerContactNo') {
            setDataValue.buyerContactNo = _.get(userData.user, "mobile", "");
        }
        //startDate , city, userName, attendee, mobile,batonNo,email,bidderAddress,pinCode,panNo,kycName,docNo,payee,depositAmount,cash,bankName,refNo,paymentDate,neftRtgsNo,buyerName,buyerAge,buyerAdd,bidCardNo,buyerContactNo
        else
           setDataValue.header = '';
    } );
    
    
  try {
      var zip = new JSZip(tplContent);
      var doc = new Docxtemplater();
      doc.loadZip(zip);
      doc.setData(setDataValue);
      doc.render();
      var buf = doc.getZip().generate({type: 'nodebuffer'});
      return cb(null,buf);
  }
  catch (error) {
      var e = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          properties: error.properties
      };
      console.log(JSON.stringify({error: e}));
      return cb(e);
  }
}

/* end of auctionmaster */
function handleError(res, err) {
  console.log("err",err);
  return res.status(500).send(err);
}
