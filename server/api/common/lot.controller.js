'use strict';

var _ = require('lodash');
var Lot = require('./lot.model');
var AuctionMaster = require('../auction/auctionmaster.model');
var async= require('async');
var ApiError = require('../../components/_error');
var Util=require('../../components/utility');
exports.create = function(req, res) {
  //console.log("I am here 1",req.body);
  var options={};
  async.series({ 
    saveLot: function(callback) {
      //console.log("I am here save");
      var model = new Lot(req.body);
      model.save(function(err, st) {
        if (err) return callback(err);
        options.dataToSend=st;
        //console.log("I am here savelot");
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
     console.log("results",results);
    //console.log("options data lot",options);
    options.dataType="lotData";
    Util.sendCompiledData(options,function(err,result){
      if(err) return handleError(res,err);
      console.log(result);
    });
    return res.status(200).json(results.saveLot);
  });
};

exports.updateLotData = function(req, res) {
  var options={};
  req.body.updatedAt = new Date();
  delete req.body._id;
  Lot.update({
    _id: req.params.id
  }, {
    $set: req.body
  }, function(err) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    options.dataToSend=req.body;
    options.dataType="lotData";
    Util.sendCompiledData(options,function(err,result){
      if(err) return handleError(res,err);
      console.log(result);
    });
    return res.status(200).json(req.body);
  });

};

exports.deleteLotMaster = function(req, res) {
  
};

exports.updateProductLotData = function(req, res) {
   var options={};
    req.body.updatedAt = new Date();
    Lot.update({
      "_id": req.params.id
    }, {
      $set: req.body
    }, function(err) {
      if (err) {
        res.status(err.status || 500).send(err);
      }
    options.dataToSend=req.body;
    options.dataType="lotData";
      Util.sendCompiledData(options,function(err,result){
      if(err) return handleError(res,err);
      console.log(result);
    });
      return res.status(200).json(req.body);
    });
  };

exports.getLotData = function(req, res) {
  var filter = {};
  var query={};
  if(req.query.hasOwnProperty('isDeleted'))
    filter.isDeleted=req.query.isDeleted;
   if(req.query.auction_Id && req.query.distinct){
  filter.auction_Id=req.query.auction_Id;
  console.log("the filter",filter);
query = Lot.find(filter).distinct('lotNumber');
   }
else if(req.query){
  if(req.query.auction_Id)
  filter.auction_Id=req.query.auction_Id;
  if(req.query.assetId)
  filter.assetId=req.query.assetId;
 if(req.query.lotNumber)
  filter.lotNumber=req.query.lotNumber;
 
 query = Lot.find(filter);

}
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    return res.json(result);
  });
};


exports.destroy = function(req, res) {
 var options={};
  console.log("id",req.params.id);
  Lot.update({
      _id: req.params.id
    },{
      "$set":{"isDeleted":true}

    })
    .exec(function(err, doc) {
      if (err) {
        return handleError(res, err);
      }
      options={};
      options.dataToSend={
       "_id":req.params.id,
       "isDeleted":true
      }
      options.dataType="lotData";
      Util.sendCompiledData(options,function(err,result){
        if(err) return handleError(res,err);
        console.log("result",result);
      });
      return res.status(200).send({
        errorCode: 0,
        message: "Lot master deleted sucessfully!!!"
      });
    });

};
exports.removeLotData = function(req, res) {
  //req.body.updatedAt = new Date();
  var field = {};
  if(req.body.flag==1){
    field = {"static_increment":1};
  }if(req.body.flag==2){
    field = {"bidIncrement":1};
  }
   Lot.update({
        _id: req.params.id
      }, {
        $unset: field // {"static_increment":1}
      }, function(err) {
        if (err) {
          res.status(err.status || 500).send(err);
        }
        //Util.sendLotData(req,res);
        return res.status(200).json(req.body);
      });
};

function handleError(res,err){
    return res.status(500).json(err);
}