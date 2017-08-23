'use strict';

var _ = require('lodash');
var Lot = require('./lot.model');
var AuctionMaster = require('../auction/auctionmaster.model');
var aysnc= require('async');
var ApiError = require('../../components/_error');

exports.create = function(req, res, next) {
  console.log("req.body", req.body);
  aysnc.series({
    fetchAuction: function(callback) {
      if (req.body && req.body.auctionId) {
        AuctionMaster.find({
          _id: req.body.auctionId
        }, function(err, auctions) {
          if (err)
            throw callback(err);
          console.log("auctions",auctions[0]);
          req.body.lastMintBid = auctions[0].lastMinBid || "";
          req.body.extendedTo = auctions[0].extendedTo || "";
          req.body.auctionId = auctions[0].auctionId;
          console.log("req.body after",req.body);
          return callback();
        });
      } else
        return callback(err);
    },
    saveLot: function(callback) {
      var model = new Lot(req.body);
      model.save(function(err, st) {
        if (err) throw callback(err);
        return callback(null, {
          message: "Data saved successfully"
        });
      });
    }
  }, function(err, results) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    console.log("results proceed",results.saveLot);
    return res.status(200).json(results.saveLot);
  });
};

exports.updateLotData = function(req, res) {

  req.body.updatedAt = new Date();
  Lot.update({
    _id: req.params.id
  }, {
    $set: req.body
  }, function(err) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    return res.status(200).json(req.body);
  });

};

exports.getLotData = function(req, res) {
  var filter = {};
  filter.auctionId=req.query.auctionId;
  console.log("filter",filter);
  var query = Lot.find(filter);
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    return res.json(result);
  });
};


exports.destroy = function(req, res, next) {
  Lot.findById(req.params.id, function(err, oneRow) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    if (!oneRow) {
      return next(new ApiError(404, "Not found"));
    }
    oneRow.remove(function(err) {
      if (err) {
        res.status(err.status || 500).send(err);
      }
      return res.status(204).send({
        message: "Data Successfully deleted!!!"
      });
    });
  });

};