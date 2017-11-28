'use strict';

var _ = require('lodash');
var async = require('async');
var NewEquipmentBulkOrder = require("./newequipmentbulkorder.model");
var Utility = require('./../../components/utility.js');


exports.get = function(req,res){
  var filter = {};
  var query = req.query;
  if(query.pagination){
    Utility.paginatedResult(req, res, NewEquipmentBulkOrder, filter, {});
    return;
  }
  var query = NewEquipmentBulkOrder.find(filter).limit(600);
  query.exec(function(err,result){
    if(err) return handleError(res,err);
    return res.status(200).json(result);
  })
}

exports.save = function(req,res){
  var bodyData = req.body;
  NewEquipmentBulkOrder.create(bodyData,function(err,result){
    if(err) return handleError(res,err);
      return res.status(200).json(result);
  });
}


function handleError(res, err) {
  return res.status(500).send(err);
}


