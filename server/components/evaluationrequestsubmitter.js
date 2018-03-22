'use strict';

var async = require("async");
var _ = require('lodash');
var ValuationModel = require('../api/enterprise/enterprisevaluation.model');
var ValuationCtrl = require('../api/enterprise/enterprise.controller');
var User = require('../api/user/user.model');
var config = require('./../config/environment');
var request = require('request');
var Encoded_Fields = ["yardParked",'disFromCustomerOffice','contactPerson','originalOwner','nameOfCustomerSeeking'];

var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
var TimeInterval =  15*60*1000;

var Field_MAP = {
    uniqueControlNo : "uniqueControlNo",
    requestType:"requestType",
    purpose : "purpose",
    agencyName : "agency.name",
    enterprise:"enterprise.name",
    enterpriseId:"enterprise.enterpriseId",
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
    customerSeekingFinance:"nameOfCustomerSeeking",
    invoiceDate:"customerInvoiceDate",
    invoiceValue:"customerInvoiceValue",
    originalOwner :'originalOwner'
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
  var query = ValuationModel.find({'enterprise.enterpriseId':enterprisers[0].enterpriseId,requestType:{$in:services},status:EnterpriseValuationStatuses[0],createdAt:{$lt:currDate},deleted:false,cancelled:false,onHold:false});
  query.lean().exec(function(err,entReqs){
    if(err || !entReqs.length){
      enterprisers.splice(0,1);
      getEnterpriseRequest(enterprisers);
      return;
    }
    async.eachLimit(entReqs,1,submitAndUpdateRequest,onComplete); 

  });

  function onComplete(err){
     enterprisers.splice(0,1);
    getEnterpriseRequest(enterprisers);
  }
}

function submitAndUpdateRequest(valReq,cb){
   if(!valReq)
      return cb();
    var dataArr = [];
    var keys = Object.keys(Field_MAP);
    if(valReq.jobId || valReq.deleted || valReq.onHold || valReq.cancelled)
       return cb();
    var obj = {};
     keys.forEach(function(key){
      obj[key] = _.get(valReq,Field_MAP[key]);
      if(Encoded_Fields.indexOf(Field_MAP[key]) !== -1){
        var buffer = new Buffer(obj[key]);
        obj[key] = buffer.toString("base64"); 
      }
    });

    if(obj.brand && obj.brand == "Other")
      obj.brand = valReq.otherBrand;

    if(obj.model && obj.model == "Other")
      obj.model = valReq.otherModel;

    var s3Path = "";
    if(valReq.assetDir)
      s3Path = config.awsUrl + config.awsBucket + config.awsBucketPrefix + valReq.assetDir + "/";
    if(s3Path && valReq.invoiceDoc&& valReq.invoiceDoc.filename)
        obj.invoiceDoc = s3Path + valReq.invoiceDoc.filename;
    if(s3Path && valReq.rcDoc && valReq.rcDoc.filename)
        obj.invoiceDoc = s3Path + valReq.rcDoc.filename;

      dataArr[dataArr.length] = obj;

    request({
        url: config.qpvalURL + "?type=Mjobcreation",
        method: "POST",
        json: true, 
        body: dataArr
    }, function (error, response, body){
      if(response && response.statusCode == 200)
          updateValuationReq(response.body);
      else{
        console.log("Error got from qpval",error);
        return cb();
      }
    });

    function updateValuationReq(resBody){

      if(!resBody|| !resBody || !resBody.length)
        return cb();
      var resItem = resBody[0];
      if(!resItem.uniqueControlNo || resItem.uniqueControlNo !== valReq.uniqueControlNo)
        return cb();
     if(resItem.success == "true"){
        valReq.jobId = resItem.jobId;
        valReq.remarks = "";
        valReq.resubmit = false;
        valReq.submittedToAgencyDate = new Date();
        setStatus(valReq,EnterpriseValuationStatuses[2]);
      }else{
        valReq.remarks = resItem.msg || "Unable to submit";
        valReq.resubmit = true;
        setStatus(valReq,EnterpriseValuationStatuses[1]);
      }
      var _id = valReq._id;
      delete valReq._id;
      ValuationModel.update({_id : _id},{$set:valReq},function(err){
        if(!err && valReq.status === EnterpriseValuationStatuses[2])
            ValuationCtrl.pushNotification(valReq);
          return cb();
      });
    }
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