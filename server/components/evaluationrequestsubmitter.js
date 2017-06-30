'use strict';

var async = require("async");
var _ = require('lodash');
var ValuationModel = require('../api/enterprise/enterprisevaluation.model');
var ValuationCtrl = require('../api/enterprise/enterprise.controller');
var User = require('../api/user/user.model');
var config = require('./../config/environment');
var request = require('request');

var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
var TimeInterval =  15*60*1000;

var Field_MAP = {
    uniqueControlNo : "uniqueControlNo",
    requestType:"requestType",
    purpose : "purpose",
    agencyName : "agency.name",
    enterprise:"enterprise.name",
    customerTransactionId : "customerTransactionId",
    customerValuationNo : "customerValuationNo",
    customerPartyNo : "customerPartyNo",
    customerPartyName : "customerPartyName",
    userName : "userName",
    requestDate : "requestDate",
    assetId:"assetId",
    repoDate : "repoDate",
    assetCategory:"assetCategory",
    valuerGroupId:"valuerGroupId",
    valuerAssetId:"valuerAssetId",
    assetDescription : "assetDescription",
    engineNo:"engineNo",
    chassisNo :"chassisNo",
    registrationNo :"registrationNo",
    serialNo:"serialNo",
    yearOfManufacturing :"yearOfManufacturing",
    category:"category",
    brand:"brand",
    model:"model",
    yardParked:"yardParked",
    country:"country",
    state:"state",
    city:"city",
    contactPerson:"contactPerson",
    contactPersonTelNo:"contactPersonTelNo",
    disFromCustomerOffice:"disFromCustomerOffice",
    customerSeekingFinance:"nameOfCustomerSeeking"
  };

  //qpvalURL
function getEnterpriseUser(){
  console.log("tick========> ",new Date().getTime());
  User.find({enterprise:true,deleted:false,status:true},function(err,enterprisers){
    if(err){ 
            return setTimeout(function () { getEnterpriseUser(); },TimeInterval);
    }else{
      getEnterpriseRequest(enterprisers);
    }
  });
}

function getEnterpriseRequest(enterprisers){

  if( !enterprisers || !enterprisers.length){
    return setTimeout(function () { getEnterpriseUser(); },TimeInterval);
  }

  var services = getAutoSubmitServices(enterprisers[0]);
  if(!services.length){
    enterprisers.splice(0,1);
    getEnterpriseRequest(enterprisers);
    return;
  }

  var currDate = new Date();
  currDate.setMinutes(currDate.getMinutes() - 20);
  ValuationModel.find({'enterprise.enterpriseId':enterprisers[0].enterpriseId,requestType:{$in:services},status:EnterpriseValuationStatuses[0],createdAt:{$lt:currDate}},function(err,entReqs){
    if(err){
      enterprisers.splice(0,1);
      getEnterpriseRequest(enterprisers);
      return;
    }
    submitRequest(entReqs,function(error,resList){
      if(error){
         enterprisers.splice(0,1);
        getEnterpriseRequest(enterprisers);
        return;
      }
      mergeRes(resList,entReqs);
      async.eachLimit(entReqs,5,updateValuationRequest,onUpdateComplete);
    });    

  });

  function updateValuationRequest(valReq,callback){
    if(!valReq)
      return callback();
    var _id = valReq._id;
    delete valReq._id;
    ValuationModel.update({_id : _id},{$set:valReq},function(err){
      if(!err)
        ValuationCtrl.pushNotification(valReq);
      return callback();
    });
  }

  function onUpdateComplete(err){
    enterprisers.splice(0,1);
    getEnterpriseRequest(enterprisers);
  }
}


function submitRequest(reqs,cb){
    if(!reqs || !reqs.length)
      return cb("No record to send");
    var dataArr = [];
    var keys = Object.keys(Field_MAP);
    reqs.forEach(function(item){
      if(item.jobId)
         return;
      var obj = {};
      keys.forEach(function(key){
        obj[key] = _.get(item,Field_MAP[key]);
      });

      if(obj.brand && obj.brand == "Other")
        obj.brand = item.otherBrand;

      if(obj.model && obj.model == "Other")
        obj.model = item.otherModel;
      
      dataArr[dataArr.length] = obj;
    });
    request({
        url: config.qpvalURL,
        method: "POST",
        json: true, 
        body: dataArr
    }, function (error, response, body){
      if(response.statusCode == 200){
        cb(null,response.body);
      }else{
        return cb("Error from server",null);
      }

    });

}

function getAutoSubmitServices(enterprsie){
  var serviceArr = [];
  if(!enterprsie.availedServices || !enterprsie.availedServices){
    return serviceArr;
  }

  enterprsie.availedServices.forEach(function(service){
    if(["Valuation","Inspection"].indexOf(service.code) !== -1 && service.approvalRequired !== 'Yes')
      serviceArr.push(service.code);
  });
  return serviceArr;
}

function getValReqByUniqueCtrlNo(list,unCtrlNo){
      var retVal = null;
      list.some(function(item){
        if(item.uniqueControlNo == unCtrlNo){
          retVal = item;
          return false;
        }
      });
      return retVal;
    }

    function mergeRes(resList,sentItems){

      resList.forEach(function(item){
        var valReq = null;
        if(item.uniqueControlNo)
          valReq = getValReqByUniqueCtrlNo(sentItems,item.uniqueControlNo);
        if(!valReq)
            return;
        if(item.success == "true"){
          valReq.jobId = item.jobId;
          valReq.submittedToAgencyDate = new Date();
          setStatus(valReq,EnterpriseValuationStatuses[2]);
        }else{
          valReq.remarks = item.msg || "Unable to submit";
          setStatus(valReq,EnterpriseValuationStatuses[1]);
        }
      });
    }

    function setStatus(entValuation,status){
      entValuation.status = status;
      var stObj = {};
      stObj.status = status;
      stObj.createdAt = new Date();
      stObj.userId = "System";
      if(!entValuation.statuses)
        entValuation.statuses = [];
      entValuation.statuses.push(stObj);
    }

exports.start = function() {
  console.log("submitter service started");
  getEnterpriseUser();
};