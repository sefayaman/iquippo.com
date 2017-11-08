'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');
var Model = require('./inputformmaster.model');
var ApiError = require('../../components/_error');
var Utility = require('./../../components/utility.js');

exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      }
  }

  if (queryParam.category)
    filter['category.name'] = queryParam.category;
  if (queryParam.brand)
    filter['brand.name'] = queryParam.brand;
  if (queryParam.model)
    filter['model.name'] = queryParam.model;
  if (queryParam.status)
    filter.status = queryParam.status;

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, Model, filter, {});
    return;
  }

  var query = Model.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

exports.search = function(req, res) {
  var body = req.body;
  var filter = {};
  
  if (body.category)
    filter['category.categoryId'] = body.category;
  if (body.brand)
    filter['brand.brandId'] = body.brand;
  if (body.model)
    filter['model.modelId'] = body.model;
  //console.log("filter", filter);

  var query = Model.find(filter);
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    var tempArr = [];
    var orignalArr = [];
    var searchVal = "";
    result.forEach(function(item){
      if(Object.keys(filter).length === 0)
        searchVal = item.category.categoryId + "";
      else if(body.category)
        searchVal = item.brand.brandId + "";
      else if(body.brand)
        searchVal = item.model.modelId + "";
      if (tempArr.indexOf(searchVal) === -1) {
          tempArr.push(searchVal);
          orignalArr.push(item);
      }
    });
    return res.status(200).json(orignalArr);
  });
};

exports.create = function(req, res, next) {

  _getRecord(req.body, function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (result.length > 0)
      return next(new ApiError(409, "Data already exits!!!"));
    else
      create();
  });

  function create() {
    var model = new Model(req.body);
    model.save(function(err, st) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json({
        message: "Data saved sucessfully"
      });
    });
  }
};

function _getRecord(data, cb) {
  var filter = {};
  filter['category.name'] = data.category.name;
  filter['brand.name'] = data.brand.name;
  filter['model.name'] = data.model.name;
  Model.find(filter, function(err, result) {
    cb(err, result);
  });
}

exports.update = function(req, res, next) {
  if (req.body._id) {
    delete req.body._id;
  }
  req.body.updatedAt = new Date();
  _getRecord(req.body, function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (result.length === 0 || (result.length === 1 && result[0]._id.toString() === req.params.id))
      return update();
    else
      return next(new ApiError(409, "Data already exits!!!"));
  });

  function update() {
    Model.update({
      _id: req.params.id
    }, {
      $set: req.body
    }, function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(req.body);
    });
  }
};

exports.destroy = function(req, res, next) {
  Model.findById(req.params.id, function(err, oneRow) {
    if (err) {
      return handleError(res, err);
    }
    if (!oneRow) {
      return next(new ApiError(404, "Not found"));
    }
    oneRow.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send({
        message: "Data deleted sucessfully!!!"
      });
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}