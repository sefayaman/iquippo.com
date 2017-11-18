'use strict';

var _ = require('lodash');
var Seq = require('seq');
var TechSpecMaster = require('./techspecmaster.model.js');
var TechSpecValMaster = require('./techspecvalmaster.model.js');
var Utility = require('./../../components/utility.js');

// Get list of all 
exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  console.log("queryparam==",queryParam);
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      }
  }

 if (queryParam.categoryId)
    filter.categoryId = queryParam.categoryId;
  if (queryParam.brand)
    filter.brand = queryParam.brand;
  if (queryParam.model)
    filter.model = queryParam.model;
  

  /*if (queryParam.pagination) {
    Utility.paginatedResult(req, res, InputFormReq, filter, {});
    return;
  }*/

  var query = TechSpecMaster.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

// Get list of all field data
exports.getFieldData = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  if (queryParam.searchStr) {
    filter['$text'] = {
      '$search': "\""+queryParam.searchStr+"\""
    }
  }

  if (queryParam.categoryId)
    filter['category.categoryId'] = queryParam.categoryId;
  if (queryParam.brandId)
    filter['brand.brandId'] = queryParam.brandId;
  if (queryParam.modelId)
    filter['model.modelId'] = queryParam.modelId;
  
  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, TechSpecValMaster, filter, {});
    return;
  }

  var query = TechSpecValMaster.find(filter);
  
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};
// Get list of all field data
/*
exports.getFieldData = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  var query = TechSpecValMaster.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};*/
exports.create = function(req, res) {//console.log("req.body=",req.body);
  TechSpecMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Data saved sucessfully", data:respo});
  });
};
exports.createfield = function(req, res) {//console.log("req.body=",req.body);
  TechSpecValMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Data saved sucessfully", data:respo});
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
    Utility.paginatedResult(req,res,TechSpecMaster,filter,{});
    return;    
  }
  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = TechSpecMaster.find(filter).sort(sortObj);
  Seq()
  .par(function(){
    var self = this;
    DealerMaster.count(filter,function(err, counts){
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
  TechSpecMaster.findById(req.params.id, function (err, inputReq) {
    if (err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    TechSpecMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};
exports.fieldUpdate = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  TechSpecValMaster.findById(req.params.id, function (err, inputReq) {
    if (err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    TechSpecValMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};
// Deletes a input req from the DB.
exports.delete = function(req, res) {
  TechSpecMaster.findById(req.params.id, function (err, inputReq) {
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
