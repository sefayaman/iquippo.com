'use strict';

var _ = require('lodash');
var Lot = require('./lot.model');
var AuctionMaster = require('../auction/auctionmaster.model');
var aysnc= require('async');
var ApiError = require('../../components/_error');
var Util=require('../../components/utility');
exports.create = function(req, res, next) {
  //console.log("req.body", req.body);
  aysnc.series({ 
    fetchAuction: function(callback) {
      if (req.body && req.body.auctionId) {
        //console.log("I am here");
        AuctionMaster.find({
          "auctionId": req.body.auctionId
        }, function(err, auctions) {
          if (err)
            return callback(err);
          console.log("-----",auctions);
          //console.log("auctions",auctions[0]);
          //req.body.lastMintBid = auctions[0].lastMinBid || "";
          //req.body.extendedTo = auctions[0].extendedTo || "";
          if(auctions.length > 0)
          req.body.auctionId = auctions[0].auctionId;
          //console.log("req.body after",req.body);
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
          message: "Data saved successfully",
          lotData:st
        });
      });
    }
  }, function(err, results) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    //console.log("results proceed",results.saveLot);
    //Util.sendLotData(results.saveLot.lotData);
    return res.status(200).json(results.saveLot);
  });
};

exports.updateLotData = function(req, res) {

  req.body.updatedAt = new Date();
  console.log("-----++++");
  delete req.body._id;
  Lot.update({
    _id: req.params.id
  }, {
    $set: req.body
  }, function(err) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    //Util.sendLotData(req.body);
    return res.status(200).json(req.body);
  });

};

exports.getLotData = function(req, res) {
  var filter = {};
  var query={};
  console.log("get Lot Data",req.query);
   if(req.query.auctionId && req.query.distinct){
  filter.auctionId=req.query.auctionId;
query = Lot.find(filter).distinct('lotNumber');
   }
else if(req.query){
  if(req.query.auctionId)
  filter.auctionId=req.query.auctionId;
  if(req.query.assetId)
  filter.assetId=req.query.assetId;
 if(req.query.lotNumber)
  filter.lotNumber=req.query.lotNumber;
 
 console.log("the filter");
 query = Lot.find(filter);

}
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    //console.log("ressults",result);
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