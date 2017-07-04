'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');
var Model = require('./kycmaster.model');
var ApiError = require('../../components/_error');

// exports.get = function(req, res) {
//   var queryParam = req.query;
//   var filter = {};

//   var query = Model.find(filter).populate({
//     path: 'category group state',
//     match: filter
//   });
//   query.exec(function(err, result) {
//     if (err) {
//       return handleError(res, err);
//     }
//     return res.status(200).json(result);
//   });
// };

exports.search = function(req, res) {
  var body = req.body;
  var filter = {};
  
  if (body.kycType)
    filter.kycType = body.kycType;
  if (body.docName)
    filter.docName = body.docName;
  if (body.status)
    filter.status = body.status;

  console.log("filter", filter);

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
      return next(new ApiError(409, "Kyc Document already exits!!!"));
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
        message: "Kyc Document saved sucessfully"
      });
    });
  }
};

function _getRecord(data, cb) {
  var filter = {};
  filter.kycDoc = data.kycDoc;
  filter.docName = data.docName;
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
      return next(new ApiError(409, "Kyc Document already exits!!!"));
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
        message: "Kyc Document deleted sucessfully!!!"
      });
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}