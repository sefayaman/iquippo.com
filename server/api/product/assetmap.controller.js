'use strict';

//var _ = require('lodash');
//var Lot = require('./lot.model');
//var AuctionMaster = require('../auction/auctionmaster.model');
var async = require('async');
//var ApiError = require('../../components/_error');
var Util = require('../../components/utility');
var AssetsInAuction = require('./productlotmap.model');
var Lot = require('../common/lot.model');

exports.create = function(req, res) {
  console.log("body Data inactive", req.body);
  if (req.body.hasOwnProperty('auctionId'))
    delete req.body.auctionId;
  if (req.body.hasOwnProperty('lotNumber')) {
    req.body.lot_id = req.body.lotNumber;
    delete req.body.lotNumber;
  }
  var options = {};
  AssetsInAuction.create(req.body, function(err, result) {
    if (err) return handleError(res, err);
    options.dataToSend = result;
    options.dataType = "assetData";
    Util.sendCompiledData(options, function(err, results) {
      if (err) return handleError(res, err);
      console.log("result", results);
    });
    return res.status(200).json({
      message: "save successfully"
    });
  })
};

exports.update = function(req, res) {
  if(!req.params.id)
    res.json({'msg':'No asset id found'});

  delete req.body._id;
  var options = {};
  req.body.updatedAt = new Date();
  AssetsInAuction.update({
    "_id": req.params.id
  }, {
    $set: req.body
  }, function(err) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    options.dataToSend = req.body;
    options.dataType = "assetData";
    console.log("daya", options);
    Util.sendCompiledData(options, function(err, result) {
      if (err) return handleError(res, err);
      console.log(result);
    });
    return res.status(200).json(req.body);
  });
};

exports.getData = function(req, res) {
  var compiledObj = {};
  var filter = {};
  var query = {};
  //console.log("req.query", req.query);
    filter.isDeleted = false;
  if (req.query.assetId) {
    filter.assetId = req.query.assetId;
  }
  console.log("the filter", filter);

  query = AssetsInAuction.find(filter);
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (result.length > 0) {
      console.log(typeof result[0]);
      if (result[0].lot_id) {
        Lot.find({
          "_id": result[0].lot_id,
          'isDeleted':false
        }, function(err, data) {
          if (err) return handleError(res, err);
          console.log("the data", typeof data[0]);
          compiledObj['lot'] = data[0];
          console.log("AssetMap", compiledObj);

          delete result[0]['lot_id'];
          compiledObj["asset"] = result[0];
          console.log("Assets", compiledObj);
          return res.status(200).json(compiledObj);
        });
      } else {
        return res.status(409).json({
          message: "Lot not found"
        });
      }
    } else {
      return res.status(200).json({
        message: "No map found"
      });
    }
  });
};