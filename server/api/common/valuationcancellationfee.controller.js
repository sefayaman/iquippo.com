'use strict';

var _ = require('lodash');
var Model = require('./valuationcancellationfee.model');
var async = require("async");
var ApiError = require('../../components/_error');

exports.get = function(req, res) {
  var filter = {};
  var query = Model.find(filter);
  query.exec(function (err, result) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res,next) {

     Model.create(req.body, function(err, st) {
      if(err) { return handleError(res, err); }
       return res.status(200).send("Valuation cancellation fee saved sucessfully");
    });
 
   /*_getRecord(req.body,function(err,result){
    if(err) { return handleError(res, err); }
    if(result.length > 0)
      return  next(new ApiError(409,"valuation purpose already exits!!!"))
    else
      create();
  });

  function create(){
     Model.create(req.body, function(err, st) {
        if(err) { return handleError(res, err); }
         return res.status(200).json({message:"valuation purpose saved sucessfully"});
      });
  }*/
};

function _getRecord(data,cb){
  var filter = {};
  filter["enterprise.enterpriseId"] = data.enterprise.enterpriseId;
  filter.valuationStatus = data.valuationStatus;
  Model.find(filter,function(err,result){
    cb(err,result);
  });
}

exports.update = function(req, res,next) {
  delete req.body._id;

  Model.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json("Valuation cancellation fee updated sucessfully");
  });
  /*if(req.body._id) { delete req.body._id; }
  if(req.body.creratedBy) { delete req.body.creratedBy; }
  req.body.updatedAt = new Date();

  _getRecord(req.body,function(err,result){
    if(err) { return handleError(res, err); }
     if(result.length == 0 ||(result.length == 1 && result[0]._id.toString() == req.params.id))
      return update();
    else
      return next(new ApiError(409,"valuation purpose already exits!!!"));
  });

  function update(){
    Model.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  }*/
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