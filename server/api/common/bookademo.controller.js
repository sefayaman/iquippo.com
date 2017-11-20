'use strict';

var _ = require('lodash');
var async = require('async');
var BookADemo = require("./bookademo.model");
var Utility = require('./../../components/utility.js');


exports.get = function(req,res){
  var filter = {};
  var query = req.query;
  if(query.pagination){
    Utility.paginatedResult(req, res, BookADemo, filter, {});
    return;
  }
  var query = BookADemo.find(filter).limit(600);
  query.exec(function(err,result){
    if(err) return handleError(res,err);
    return res.status(200).json(result);
  })
}

exports.create = function(req,res){
  var bodyData = req.body;
  BookADemo.create(bodyData,function(err,result){
    if(err) return handleError(res,err);
      return res.status(200).send("Request submitted successfully.");
  });
}


function handleError(res, err) {
  return res.status(500).send(err);
}


