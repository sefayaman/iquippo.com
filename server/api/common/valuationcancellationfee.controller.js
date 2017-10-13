'use strict';

var _ = require('lodash');
var Model = require('./valuationcancellationfee.model');
var EnterpriseValuation = require('./../enterprise/enterprisevaluation.model');
var Utility = require('./../../components/utility.js');
var async = require("async");
var request = require('request');
var config = require('./../../config/environment');
var ApiError = require('../../components/_error');

exports.get = function(req, res,next) {
  var filter = {
    deleted:false
  };
  var query = Model.find(filter);
  query.exec(function (err, result) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(result);
  });
};

exports.getCancellationFee = function(req, res) {
  var valuationReq = req.valuationRequest;

  var serverObj = {
    uniqueControlNo:valuationReq.uniqueControlNo,
    jobId:valuationReq.jobId
  };

  if(valuationReq.jobId)
    getStatusFromQVAPL();
  else
    getCancellationFee();

  function getStatusFromQVAPL(cb){
    console.log("serverObj",serverObj);
     request({
        url: config.qpvalURL + "?type=statuscheck",
        method: "POST",
        json: true, 
        body: [serverObj]
    }, function (error, response, body){
      if(error)
        return res.status(412).send("Unable to find status of valuation request");
      console.log("response.body",response.body);
      if(response.statusCode == 200 && response.body.length && response.body[0] && response.body[0].success === 'true'){
          var status = Utility.convertQVAPLStatus(response.body[0].status);
          
          if(status === 'Cancelled'){
              status = valuationReq.status;
              return getCancellationFee(status,true);
          }

          if(status)
            getCancellationFee(status);
          else
            return res.status(412).send("Unable to find status of valuation request");    
      }else{
        return res.status(412).send("Unable to find status of valuation request");
      }

    });

  }

  function getCancellationFee(status,cancelled){
    var filter = {
      valuationStatus:status || valuationReq.status,
      'enterprise.enterpriseId': req.query.enterpriseId,
      status:true,
      deleted:false
    };
    var query = Model.find(filter);
    query.exec(function (err, result) {
      if(err) { return handleError(res, err); }
      if(result.length && cancelled){
        result[0] = result[0].toObject();
        result[0].cancelled = true;
      }
      return res.status(200).json(result);
    });
    
  }
};

exports.getValuationRequest = function(req,res,next){
  var _id = req.query._id;
  if(!_id || !req.query.enterpriseId)
    return res.status(400).send("Invalid request");
  EnterpriseValuation.findById(_id,function(err,valReq){
    if(err) { return handleError(res, err); }
    if(!valReq) return res.status(404).send("Valuation request not found");
    req.valuationRequest = valReq;
    next();
  });
  
}

exports.create = function(req, res,next) {

     Model.create(req.body, function(err, st) {
      if(err) { return handleError(res, err); }
       return res.status(200).send("Valuation cancellation fee saved sucessfully");
    });
};


exports.update = function(req, res,next) {
  delete req.body._id;

  Model.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json("Valuation cancellation fee updated sucessfully");
  });
};

exports.validate = function(req,res,next){

  async.parallel([validateRequiredField,checkRecord],function(err,result){
    if(err)
      return res.status(err.status).send(err.msg);
    return next();
  });

function validateRequiredField(callback){
  var reqFields = ['enterprise.enterpriseId','amount','valuationStatus'];
  var isValid = reqFields.every(function(key){
      var val = _.get(req.body,key,"");
      if(val)
        return true;
  });
  if(!isValid)
    return callback({status:400,msg:"Missing required parameter"});
  else
      return callback();
}

function checkRecord(callback){
  var filter = {};
  filter["enterprise.enterpriseId"] = req.body.enterprise.enterpriseId;
  filter.valuationStatus = req.body.valuationStatus;
  Model.find(filter,function(err,result){
    if(err)
      return callback({status:500,msg:"Unable to validate record"});
    if(!req.params.id && result.length)
      return callback({status:409,msg:"Valuation cancellation fee master already exits!!!"});
    else if(req.params.id && result.length && (result.length > 1 || result[0]._id.toString() !== req.params.id))
      return callback({status:409,msg:"Valuation cancellation fee master already exits!!!"});
    else
      return callback();
  });
 }

}

exports.destroy = function(req, res,next) {
  Model.findById(req.params.id, function (err, oneRow) {
    if(err) { return handleError(res, err); }
    if(!oneRow) { return next(new ApiError(404,"Not found")) }
    oneRow.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send({message:"valuation purpose deleted sucessfully!!!"});
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}