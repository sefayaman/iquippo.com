'use strict';

var _ = require('lodash');
var Model = require('./servicetax.model');
var ApiError = require('../../components/_error');

exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  if(queryParam.type)
    filter['type'] = queryParam.type;
  if(queryParam.current == 'y'){
     filter["effectiveFromDate"] = {$lte:new Date()};
     filter["effectiveToDate"] = {$gte:new Date()};
  }
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
      return  next(new ApiError(409,"Service tax already exits!!!"))
    else
      create();
  });

  function create(){
     Model.create(req.body, function(err, st) {
        if(err) { return handleError(res, err); }
         return res.status(200).json({message:"Service tax saved sucessfully"});
      });
  }
};

function _getRecord(data,cb){
  var filter = {};
  filter["type"] = data.type;
  filter["effectiveFromDate"] = {$lte:data.effectiveToDate};
  filter["effectiveToDate"] = {$gte:data.effectiveFromDate};
  Model.find(filter,function(err,result){
    cb(err,result);
  })
}

exports.update = function(req, res,next) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  _getRecord(req.body,function(err,result){
    if(err) { return handleError(res, err); }
     if(result.length == 0 ||(result.length == 1 && result[0]._id.toString() == req.params.id))
      return update();
    else
      return next(new ApiError(409,"Service tax already exits!!!"));
  });

  function update(){
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
      return res.status(204).send({message:"Service tax deleted sucessfully!!!"});
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}