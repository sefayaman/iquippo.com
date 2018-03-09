'use strict';

var async = require("async");
var _ = require('lodash');
var ValuationModel = require('../api/enterprise/enterprisevaluation.model');
var User = require('../api/user/user.model');
var config = require('./../config/environment');
var request = require('request');
var fs = require("fs");
var Utility = require('./utility.js');
var EnterpriseValuationStatuses = ['Valuation Report Submitted','Invoice Generated'];
var TimeInterval =  15*60*1000;
var fileName = "Format_revised.csv"; 
var localFilePath = config.uploadPath + "temp/" +  fileName;
var Field_MAP = {
    "GPSID": "gpsDeviceNo",
    "VALUATION_NO":"uniqueControlNo",
    "ASSET_DETAILS" : "assetDetails",
    "YEAROFMFG" : "agencyYearOfManufacturing",
    "ENGINENO":"agencyEngineNo",
    "CHASISNO":"agencyChassisNo",
    "REGISTRATION_NO" : "agencyRegistrationNo",
    "SERIAL_NO" : "agencySerialNo",
    "INSERT_DATETIME":"INSERT_DATETIME",
    "BOOKED":"BOOKED",
    "NG_CONTRACT_NO":"NG_CONTRACT_NO",
    "ASSET_ID":"ASSET_ID"
  };

  var SETTING_KEY = "valuationreport";
 
//qpvalURL
function getEnterpriseUser(){
  if(!checkExecutionTime()){
    return setTimeout(function () { getEnterpriseUser(); },getSleepTime());
  }

  User.find({enterprise:true,deleted:false,status:true,role:'enterprise',valuationReport:true},function(err,enterprisers){
    if(err) return handleError(err);
    getEnterpriseRequest(enterprisers);
  });
}

function getEnterpriseRequest(enterprisers){

    if( !enterprisers || !enterprisers.length){
      return setTimeout(function () { getEnterpriseUser(); },getSleepTime());
    }
    var enterpriseIds = [];
    enterprisers.forEach(function(user){
      enterpriseIds.push(user.enterpriseId);
    });  

    var currDate = new Date();
    currDate.setDate(currDate.getDate() - 2);
    currDate.setHours(24,0,0);
    ValuationModel.find({'enterprise.enterpriseId':{$in:enterpriseIds},status:{$in:EnterpriseValuationStatuses},
      createdAt:{$gt:currDate},deleted:false,cancelled:false,onHold:false}
      ,function(err,entReqs){
        if(err) return handleError(err);   
        createCsv(entReqs);
    });
  }

function createCsv(entReqs){
  var csvStr = "";
  var headers = Object.keys(Field_MAP);
  csvStr +=  headers.join(",");
  csvStr += "\r\n";
  entReqs.forEach(function(item){
    headers.forEach(function(key){
        var val = _.get(item,Field_MAP[key],"");
        if(key === "ASSET_DETAILS")
          val = getAssetDetail(item);
        val = Utility.toCsvValue(val);
         csvStr += val + ",";
    });
    csvStr += "\r\n";
  });
  try{
     fs.writeFileSync(localFilePath, new Buffer(csvStr, 'binary'));
      async.parallel([uploadFileonS3,uploadFileOnFtp],function(err){
        if(err) return  handleError(err);
        return setTimeout(function () { getEnterpriseUser(); },getSleepTime());
      });
  }catch(e){
    handleError(e);
  }

  function uploadFileonS3(cb){
      var opts = {
        localFile: localFilePath,
        key: "assets/uploads/valuationreport/" + fileName,
      };
      var files = [{
        path:localFilePath
      }];
      Utility.uploadMultipartFileOnS3(opts.localFile,opts.key,files,function(err, s3res) {
        cb(err);
      },true);
  }

  function uploadFileOnFtp(cb){
    Utility.uploadFileOnFtp(localFilePath,config.valuationReportRemotePath + fileName,function(err){
      cb(err);
    });
}

}


function getAssetDetail(item){
  var valStr = "";
  valStr += item.assetCategory;
  
  if(item.brand){
    if(item.brand == "Other")
      valStr += " " + item.otherBrand;
    else
      valStr += " " + item.brand;
  }

  if(item.model){
    if(item.model == "Other")
      valStr += " " + item.otherModel;
    else
      valStr += " " + item.model;
  }
  return valStr;
}

function handleError(err){
  console.log("Error in valuation report generation",err);
   if(checkExecutionTime()) 
    return setTimeout(function () { getEnterpriseUser(); },TimeInterval);
  else{
    return setTimeout(function () { getEnterpriseUser(); },getSleepTime());
  }
}

 function checkExecutionTime(){
    var d = new Date();
    d.setHours(2,0,0);
    if(d.getHours() >= 2 && d.getHours() < 4)
      return true;
    else
      return false;
 }

function  getSleepTime(){
  var sleepTime = 0;
  var currentTime = new Date().getTime();
  var dt = new Date();
  if(dt.getHours() >= 2)
    dt.setDate(dt.getDate() + 1);
  dt.setHours(2,0,0);
  if(dt.getTime() > currentTime)
    sleepTime = dt.getTime() - currentTime;
  return sleepTime;
}

exports.start = function() {
  console.log("submitter service started");
  getEnterpriseUser();
};