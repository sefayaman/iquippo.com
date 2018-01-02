'use strict';

var _ = require('lodash');
var Seq = require('seq');
var TechSpecMaster = require('./techspecmaster.model.js');
var Product = require('./../product/product.model.js');
var TechSpecValMaster = require('./techspecvalmaster.model.js');
var Utility = require('./../../components/utility.js');

// Get list of all 
exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
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
  

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, TechSpecMaster, filter, {});
    return;
  }

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
    filter['category.categoryId'] = queryParam.categoryId + "";
  if (queryParam.brandId)
    filter['brand.brandId'] = queryParam.brandId + "";
  if (queryParam.modelId)
    filter['model.modelId'] = queryParam.modelId + "";

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, TechSpecValMaster, filter, {});
    return;
  }

  var query = TechSpecValMaster.find(filter).sort({createdAt: -1});
  
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res) {
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
    query.exec(function (err, fieldValue) {
        if(err) { return handleError(res, err); }
        result.inputReqs = fieldValue;
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
  TechSpecMaster.findById(req.params.id, function (err, field) {
    if (err) { return handleError(res, err); }
    if(!field) { return res.status(404).send('Not Found'); }
    TechSpecMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};
exports.fieldUpdate = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  TechSpecValMaster.findById(req.params.id, function (err, fieldValue) {
    if (err) { return handleError(res, err); }
    if(!fieldValue) { return res.status(404).send('Not Found'); }
    TechSpecValMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        updateProduct(req.body);
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};

function updateProduct(techSpecData){
  var filter = {};
  filter['category._id'] = techSpecData.category.categoryId;
  filter['brand._id'] = techSpecData.brand.brandId;
  filter['model._id'] = techSpecData.model.modelId;
  filter.productCondition = 'new';
  var techSpecs = [];
  techSpecData.fields.forEach(function(item){
    if(item && item.isFront) {
      var dataObj = {};
      dataObj.name = item.name;
      dataObj.value = item.value;
      dataObj.priority = item.priority || 0;
      techSpecs[techSpecs.length] = dataObj;
    }
  });
  var dataToUpdate = {'techSpec' : techSpecs};
  Product.update(filter,{$set:dataToUpdate}).exec();
}

// Deletes a input req from the DB.
exports.delete = function(req, res) {
  TechSpecMaster.findById(req.params.id, function (err, field) {
    if(err) { return handleError(res, err); }
    if(!field) { return res.status(404).send('Not Found'); }
    field.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.fieldDelete = function(req, res) {
  TechSpecValMaster.findById(req.params.id, function (err, fieldValue) {
    if(err) { return handleError(res, err); }
    if(!fieldValue) { return res.status(404).send('Not Found'); }
    fieldValue.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
