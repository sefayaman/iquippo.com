'use strict';

var async = require("async");
var _ = require('lodash');
var ValuationModel = require('../api/enterprise/enterprisevaluation.model');
var User = require('../api/user/user.model');
var config = require('./../config/environment');
var request = require('request');
var fs = require("fs");
var Utility = require('./../../components/utility.js');
var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
var TimeInterval =  15*60*1000;
var SLEEP_TIME = 22*60*60*1000;
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
    "SERIAL_NO" : "agencySerialNo"
    "INSERT_DATETIME":"INSERT_DATETIME",
    "BOOKED":"BOOKED",
    "NG_CONTRACT_NO":"NG_CONTRACT_NO",
    "ASSET_ID":"ASSET_ID"
  };
 
//qpvalURL
function getEnterpriseUser(){
  if(!checkMidNight()){
    return setTimeout(function () { getEnterpriseUser(); },TimeInterval);
  }
  User.find({enterprise:true,deleted:false,status:true,valuationReport:true},function(err,enterprisers){
    if(err) return handleError(err);
    getEnterpriseRequest(enterprisers);
  });
}

function getEnterpriseRequest(enterprisers){

    if( !enterprisers || !enterprisers.length){
      return setTimeout(function () { getEnterpriseUser(); },SLEEP_TIME);
    }
    var enterpriseIds = [];
    enterprisers.forEach(function(user){
      enterpriseIds.push(user.enterperiseId);
    });  

    var currDate = new Date();
    currDate.setDate(currDate.getDate() - 1);
    ValuationModel.find({'enterprise.enterpriseId':{$in:enterpriseIds},status:EnterpriseValuationStatuses[4],
      createdAt:{$gte:currDate},deleted:false,cancelled:false,onHold:false}
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
     fs.writeFileSync(localFilePath, buff);
      uploadFile();
  }catch(e){
    handleError(e);
  }

}

function uploadFile(){
      var opts = {
        localFile: localFilePath,
        key: "assets/uploads/valuationreport/" + file,
      };
      var files = [{
        path:localFilePath
      }];
      Utility.uploadMultipartFileOnS3(opts.localFile,opts.key,files,function(err, s3res) {
        if(err) return  handleError(e);
        return setTimeout(function () { getEnterpriseUser(); },SLEEP_TIME);
      });
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
   if(checkMidNight()) 
    return setTimeout(function () { getEnterpriseUser(); },TimeInterval);
  else
    return setTimeout(function () { getEnterpriseUser(); },SLEEP_TIME);
}

 function checkMidNight(){
    var d = new Date();
    if(d.getHours() > 22)
      return true;
    else
      return false;
  }

exports.start = function() {
  console.log("submitter service started");
  getEnterpriseUser();
};