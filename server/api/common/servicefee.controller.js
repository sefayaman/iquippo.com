'use strict';

var _ = require('lodash');
var Model = require('./servicefee.model');
var ApiError = require('../../components/_error');

exports.get = function(req, res) {
 
  var filter = {};
  var queryParam = req.query;
  if(queryParam.agencyId)
    filter['agency._id'] = queryParam.agencyId;
  if(queryParam.enterpriseId)
    filter['enterpriseId'] = queryParam.enterpriseId;
  if(queryParam.requestType)
    filter['serviceType'] = queryParam.requestType;

  if(queryParam.current == 'y'){
     filter["effectiveFromDate"] = {$lte:new Date()};
     filter["effectiveToDate"] = {$gte:new Date()};
  }
  
  //console.log("@@@@@@",filter);
  var query = Model.find(filter);
  query.exec(function (err, result) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res,next) { 
   _getRecord(req.body,function(err,result){
    if(err) { return handleError(res, err); }
    if(result.length > 0)
      return  next(new ApiError(409,"service fee already exits!!!"))
    else
      create();
  });

  function create(){
     Model.create(req.body, function(err, st) {
        if(err) { return handleError(res, err); }
         return res.status(200).json({message:"service fee saved sucessfully"});
      });
  }
};

function _getRecord(data,cb){
  var filter = {};
  filter["serviceType"] = data.serviceType;
  filter["enterpriseId"] = data.enterpriseId;
  filter["agency._id"] = data.agency._id;
  filter["effectiveFromDate"] = {$lte:data.effectiveToDate};
  filter["effectiveToDate"] = {$gte:data.effectiveFromDate};
  Model.find(filter,function(err,result){
    return cb(err,result);
  })
}

exports.update = function(req, res,next) {

  _getRecord(req.body,function(err,result){
    if(err) { return handleError(res, err); }
     if(result.length == 0 ||(result.length == 1 && result[0]._id.toString() == req.params.id))
      return update();
    else
      return next(new ApiError(409,"Service fee already exits!!!"));
  });

  function update(){
    
    if(req.body._id) { delete req.body._id; }
    req.body.updatedAt = new Date();

    Model.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  }
};

exports.destroy = function(req, res,next) {
  Model.findById(req.params.id, function (err, oneRow) {
    if(err) { return handleError(res, err); }
    if(!oneRow) { return next(new ApiError(404,"Not found")) }
    oneRow.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send({message:"Service fee deleted sucessfully!!!"});
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}