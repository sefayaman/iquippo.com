'use strict';

//var _ = require('lodash');
//var Lot = require('./lot.model');
//var AuctionMaster = require('../auction/auctionmaster.model');
var async = require('async');
//var ApiError = require('../../components/_error');
var Util = require('../../components/utility');
var AssetsInAuction = require('./productlotmap.model');
var Lot = require('../common/lot.model');
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];
var Product = require('../product/product.model');

exports.create = function(req, res) {
  var options = {};
  AssetsInAuction.create(req.body, function(err, result) {
    if (err) return handleError(res, err);
    postRequest(req, res)
  })
};

function postRequest(req, res){
  var options = {};
  AssetsInAuction.find({
      "assetId": req.body.assetId
    }, function(err, result) {
      options.dataToSend = result[0].toObject();
      options.dataType = "assetData";
      if (options.dataToSend.createdBy)
        delete options.dataToSend.createdBy;
      Util.sendCompiledData(options, function(err, result) {
        if (err || (result && result.err)) {
          options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
          update(options.dataToSend);
          // if(result && result.err)
          //     return res.status(412).send(result.err);
          // return res.status(412).send("Unable to post asset request. Please contact support team.");
        }
        if(result){
          options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
          update(options.dataToSend);
          //return res.status(201).json({errorCode: 0,message: "Product request submitted successfully !!!"});
        }
      });
    });
}

  function update(assetReq){
    var _id = assetReq._id;
    delete assetReq._id;
    AssetsInAuction.update({_id:_id},{$set:assetReq},function(err,retVal){
      if (err) { console.log("Error with updating auction request");}
    console.log("Product Updated");
    });
    Product.update({"assetId":assetReq.assetID, deleted:false },{$set:{"reqSubmitStatus":assetReq.reqSubmitStatus}}).exec();
  }

  exports.sendReqToCreateAsset=function(req,res){
    postRequest(req, res);
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
    postRequest(req, res);
  });
};

exports.getData = function(req, res) {
  var compiledObj = {};
  var filter = {};
  var query = {};
  filter.isDeleted = false;
  if (req.query.assetId) {
    filter.assetId = req.query.assetId;
  }
  
  query = AssetsInAuction.find(filter);
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (result.length > 0 && result.length < 2) {
      if (result[0].lot_id) {
        Lot.find({
          "_id": result[0].lot_id,
          'isDeleted':false
        }, function(err, data) {
          if (err) return handleError(res, err);
          compiledObj['lot'] = data[0];
          delete result[0]['lot_id'];
          compiledObj["asset"] = result[0];
          return res.status(200).json(compiledObj);
        });
      } else {
        return res.status(409).json({
          message: "Lot not found"
        });
      }
    } else {
      AssetsInAuction.update({
        "assetId":req.query.assetId
      },{
        $set:{'isDeleted':true}
      },{multi:true},function(asseterr,assresp){
       if (err) return handleError(res,err)
      })
      return res.status(200).json({
        message: "No map found"
      });
    }
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
};