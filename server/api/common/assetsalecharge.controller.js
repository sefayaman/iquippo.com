'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');
var Model = require('./assetsalecharge.model');
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

  if (queryParam.enterpriseId)
    filter.enterpriseId = queryParam.enterpriseId;

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, Model, filter, {});
    return;
  }

  var query = Model.find(filter).populate({
    path: 'category.categoryId',
    match: filter
  });
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
  var date=new Date();

  if (body.categoryId) {
    filter['category.categoryId'] = body.categoryId;
  }
  if (body.enterpriseId)
    filter.enterpriseId = body.enterpriseId;
  if (body.status)
    filter.status = body.status;

  var query = Model.find(filter).populate({
    path: 'category',
    match: filter
  });
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    console.log("result",result);
    return res.status(200).json(result);
  });
};

exports.create = function(req, res, next) {
  _getRecord(req.body, function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (result.length > 0)
      return next(new ApiError(409, "Asset sale charge already exits!!!"));
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
        message: "Asset sale charge saved sucessfully"
      });
    });
  }
};

function _getRecord(data, cb) {
  var filter = {};
  if(data.userRole)
    filter.userRole = data.userRole;
  if(data.enterpriseId)
    filter.enterpriseId = data.enterpriseId;
  if(data.user && data.user.userId)
    filter['user.userId'] = data.user.userId;
  if(data.category && data.category.categoryId)
    filter['category.categoryId'] = data.category.categoryId;
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
      return next(new ApiError(409, "Asset sale charge already exits!!!"));
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
        message: "Asset sale charge sucessfully!!!"
      });
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}