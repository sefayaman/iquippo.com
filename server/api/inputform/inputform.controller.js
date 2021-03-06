'use strict';

var _ = require('lodash');
var Seq = require('seq');
var InputFormReq = require('./inputform.model');
var Utility = require('./../../components/utility.js');

// Get list of all input req
exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      }
  }

  if (queryParam.category)
    filter.category = queryParam.category;
  if (queryParam.brand)
    filter.brand = queryParam.brand;
  if (queryParam.model)
    filter.model = queryParam.model;
  if (queryParam.userId)
    filter['user.userData'] = queryParam.userId;

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, InputFormReq, filter, {});
    return;
  }

  var query = InputFormReq.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

// Get a single bid
/*exports.getOnId = function(req, res) {
  InputFormReq.findById(req.params.id, function (err, bid) {
    if(err) { return handleError(res, err); }
    if(!bid) { return res.status(404).send('Not Found'); }
    return res.json(bid);
  });
};*/

// Creates a new valuation in the DB.
exports.create = function(req, res) {
  InputFormReq.create(req.body, function(err, inputReq) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Request saved sucessfully", data:inputReq});
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  var filter = {};
  // if(req.body._id)
  //   filter["_id"] = req.body._id;
  // if(req.body.userId)
  //   filter["user._id"] = req.body.userId;
  // if(req.body.mobile)
  //   filter["user.mobile"] = req.body.mobile;
  if (req.query.searchStr) {
    filter['$text'] = {
      '$search': "\""+req.query.searchStr+"\""
    }
  }

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,InputFormReq,filter,{});
    return;    
  }
  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = InputFormReq.find(filter).sort(sortObj);
  Seq()
  .par(function(){
    var self = this;
    InputFormReq.count(filter,function(err, counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){
    var self = this;
    query.exec(function (err, inputReq) {
        if(err) { return handleError(res, err); }
        result.inputReqs = inputReq;
        self();
       }
    );

  })
  .seq(function(){
    return res.status(200).json(result.inputReqs);
  })
};

// Updates an existing input req in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  InputFormReq.findById(req.params.id, function (err, inputReq) {
    if (err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    InputFormReq.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};

// Deletes a input req from the DB.
exports.delete = function(req, res) {
  InputFormReq.findById(req.params.id, function (err, inputReq) {
    if(err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    inputReq.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
