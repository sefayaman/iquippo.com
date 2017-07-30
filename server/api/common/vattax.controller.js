'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');
var Model = require('./vattax.model');
var ApiError = require('../../components/_error');

exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  if(queryParam.categoryId)
    filter.category = queryParam.categoryId;
  if(queryParam.groupId)
    filter.group = queryParam.groupId;
  
  if(queryParam.currentDate && queryParam.currentDate === 'y') {
      filter["effectiveFromDate"] = {$lte:new Date()};
      filter["effectiveToDate"] = {$gte:new Date()};
  }

  var query = Model.find(filter).populate({
    path: 'category group state'
  });
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    if(result.length && queryParam.state){
      
      var resList = result.filter(function(item){
        return item.state.name === queryParam.state;
      });
      return res.status(200).json(resList); 
    } 

    return res.status(200).json(result);
  });
};

exports.search = function(req, res) {
  console.log("req.body", req.body);
  var body = req.body;
  var filter = {};
  
    /*filter.effectiveFromDate = {
      '$gt': date
    };
    filter.effectiveToDate = {
      '$lt': date
    };*/
  if(body.date) {
      filter["effectiveFromDate"] = {$lte:new Date()};
      filter["effectiveToDate"] = {$gte:new Date()};
  }

  if (body.groupId) {
    //var id = mongoose.Types.ObjectId(body.groupId)
    filter.group = body.groupId;
  }
  if (body.categoryId) {
    //var id = mongoose.Types.ObjectId(body.groupId)
    filter.category = body.categoryId;
  }
  if (body.taxType)
    filter.taxType = body.taxType;
  if (body.stateId)
    filter.state = body.stateId;
  if (body.status)
    filter.status = body.status;
  
  var query = Model.find(filter);
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
      return next(new ApiError(409, "Vat tax already exits!!!"));
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
        message: "Vat tax saved sucessfully"
      });
    });
  }
};

function _getRecord(data, cb) {
  var filter = {};
  if(data.category)
    filter.category = data.category;
  if(data.state)
    filter.state = data.state;
  filter.effectiveFromDate = data.effectiveFromDate;
  filter.effectiveToDate = data.effectiveToDate;
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
      return next(new ApiError(409, "Vat tax already exits!!!"));
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
        message: "Vat tax deleted sucessfully!!!"
      });
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}