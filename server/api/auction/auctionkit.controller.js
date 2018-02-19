'use strict';

var _ = require('lodash');
var trim = require('trim');
var AuctionMaster = require('./auctionmaster.model');
var UserRegForAuctionModel = require('./userregisterforauction.model');
var PaymentModel = require('./../payment/payment.model');
var UserModel = require('./../user/user.model');
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


exports.populateData = function(req,res,next){
  var bodyData = req.body;
  if(!bodyData.auctionId || !bodyData.transactionId || !bodyData.userId)
    return res.status(412).send("Invalid kit generation request");
   async.parallel([getAuctionData,getUserRegistrationData,getPaymentData,getUserData],function(err){
      if(err) return res.status(err.status || 500).send(err.message || err.data);
      next();
   });
  
  function getAuctionData(cb){
    AuctionMaster.find({_id:bodyData.auctionId},function(err,aucData){
      if(err) return cb(err);
      if(!aucData || !aucData.length)
        return cb(new ApiError(404, "Auction not found"));
      if(!aucData[0].registrationTemplate || !aucData[0].undertakingTemplate)
      return cb(new ApiError(404, "Registration or undertaking form template is not found"));
      req.auctionData = aucData[0];
      return cb();
    });
  }

  function getUserRegistrationData(cb){
    UserRegForAuctionModel.find({"auction.dbAuctionId":bodyData.auctionId,"user._id":bodyData.userId},function(err,userData){
        if(err) return cb(err);
        if(!userData || !userData.length)
          return cb(new ApiError(400, "User registration data not found"));
        req.userData = userData[0];
        return cb();
    });
  }

  function getPaymentData(cb){
    var payObjId = new mongo.ObjectID(bodyData.transactionId);
    PaymentModel.find({"_id":payObjId},function(err,paymentData){
       if(err) return cb(err);
       if(!paymentData || !paymentData.length)
          return cb(new ApiError(404, "Payment not found"));
        if(!paymentData[0].payments.length)
          return cb(new ApiError(404, "Payment not found"));
        req.paymentData =  paymentData[0].payments[0];
        return cb();
    });
  }

  function getUserData(cb){
    UserModel.find({"_id":bodyData.userId},function(err,users){
       if(err) return cb(err);
       if(!users || !users.length)
          return cb(new ApiError(404, "Customer not found"));     
        req.user =  users[0];
        return cb();
    });
  }
}

exports.generateKit = function(req,res){
  var bodyData = req.body;
  async.parallel([generateRegistrationKit,generateUndertakingKit],onKitGenerated);
  function onKitGenerated(err){
    if(err)
      return res.status(err.status || 500).send(err.message || err.data);//handleError(res,err);
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
    downloadFile(req.auctionData.registrationTemplate,function(err,resCont){
        var data = {};
        setUserData(req.user,req.userData,data);
        setAuctionData(req.auctionData,data);
        setPaymentData(req.paymentData,data);
        generateKit(data,resCont,onRegComplete);
    });
    
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
    downloadFile(req.auctionData.undertakingTemplate,function(err,resCont){
      var data = {};
      setUserData(req.user,req.userData,data);
      setAuctionData(req.auctionData,data);
      setPaymentData(req.paymentData,data);
      generateKit(data,resCont,onUndertakingComplete);
    });

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
      var localFilePath = config.uploadPath + "auction/" + file;
      if(fs.existsSync(localFilePath)){
        readFile();
        return; 
      }
      var opts = {
        localFile: config.uploadPath + "auction/" + file,
        key: "assets/uploads/auction/" + file
      };

      Utility.downloadFileFromS3(opts, function(err, s3res) {
        if (err) {
          debug(err);
          return cb(err);
        }
        return readFile();
      });

      function readFile(){
        try{
          var content = fs.readFileSync(localFilePath, 'binary');
          return cb(null,content);
        }catch(ex){
          return cb(ex);
        }
      }
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
          properties: error.properties
      };
      return cb(e);
  }
}

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

var User_Variable = {
  "fname" : "fname",
  "lname" : "lname",
  "mobile" : "mobile",
  "batonNo" : "batonNo",
  "email" : "email",
  "bidderCity" : "city",
  "bidderState" : "state",
  "bidderCountry" : "country",
  //"bidderAddress" : "bidderAddress",
  "pinCode" : "pinCode",
  "panNumber" : "panNumber",
  "kycInfo" : "kycInfo",
  "payeeFname" : "fname",
  "payeeLname" : "lname",
  "buyerFname" : "fname",
  "buyerLname" : "lname",
  "buyerAge":"buyerAge",
  "buyerCity":"city",
  "buyerState":"state",
  "buyerCountry":"country",
  //"bidCardNo":"batonNo",
  "buyerContactNo":"mobile"
}

var Payment_Variable = {
  "depositAmount" : "amount",
  "cash" : "cash",
  "bankName" : "bankname",
  "refNo" : "refNo",
  "paymentDate" : "paymentDate",
  "neftRtgsNo":"neftRtgsNo"
}

var Auction_Variable = {
  "startDate" : "startDate",
  "city" : "city",
}

 function setUserData(user,userData,data){
    Object.keys(User_Variable).forEach(function(key){
      var val = _.get(user,User_Variable[key],"");
      
      if (key==='kycInfo') {
        if(user.kycInfo && user.kycInfo.length){
          data.kycType = _.get(user.kycInfo[0],"type", "");
          data.kycName = _.get(user.kycInfo[0],"name", "");
        }else{
           data.kycType = "";
          data.kycName = "";
        }
        return;
      }
      if(key ==='batonNo') {
        data.batonNo = _.get(userData.user, "batonNo", "");
        data.bidCardNo = data.batonNo;
        return;  
      }
      if(!val)
        val = "";
      data[key] = val;
    });
 }

 function setPaymentData(payment,data){
    Object.keys(Payment_Variable).forEach(function(key){
      var val = _.get(payment,Payment_Variable[key],"");
      if (key==='cash') {
        if(payment && payment.paymentModeType==='Cash'){
          val = 'Cash';
        }
        else
          val = '';
      }

      if(key ==='paymentDate') {
          val = moment(payment.paymentDate).utcOffset('+0530').format('MM/DD/YYYY');
      }
       if(!val)
        val = "";
      data[key] = val;
    });
 }

 function setAuctionData(auctionData,data){
    Object.keys(Auction_Variable).forEach(function(key){
      var val = _.get(auctionData,Auction_Variable[key]);
      if(key==='startDate') {
          val = moment(auctionData.startDate).utcOffset('+0530').format('MM/DD/YYYY');
      }
      if(!val)
        val = "";
      data[key] = val;
    });
 }

function handleError(res, err) {
  console.log("err",err);
  return res.status(500).send(err);
}
