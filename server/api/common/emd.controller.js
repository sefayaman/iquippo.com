'use strict';

var _ = require('lodash');
var Emd = require('./emd.model');
var ApiError = require('../../components/_error');
var async = require('async');
var Util=require('../../components/utility');

exports.create = function(req, res, next) {
  console.log("emdsD",req.body);
  var options={};
  var model = new Emd(req.body);
  model.save(function(err, st) {
    if (err) {
      return res.status(err.status || 500).send(err);
    }
    options.dataToSend=st;
    options.dataType="emdData";
    Util.sendCompiledData(options,function(err,results){
      if(err) handleError(res,err);
      console.log("emds",results);
    });
    return res.status(200).json({
      message: "Data saved sucessfully"
    });
  });



};

exports.updateEmdData = function(req, res) {

  req.body.updatedAt = new Date();
  Emd.update({
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

exports.getEmdData = function(req, res) {
  console.log("req query",req.query);
  var filter = {};
  if (req.body._id) {
    filter["auctionId"] = req.body._id;
  }
  if (req.body.selectedLots && req.body.selectedLots.lotNumber) {
    //console.log("selectedLots",req.body.selectedLots);
    filter["selectedLots.lotNumber"] = {
      $in: req.body.selectedLots.lotNumber
    }
  }
  console.log("filter for checking EmdData", filter);
  var query = Emd.find(filter);
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    console.log("emdresult", result);
    return res.json(result);
  });
};

exports.getEmdAmountData = function(req, res, callback) {

  console.log("getEmdAmountData", req.query);
  var arr=[]
  if(req.query.selectedLots)
    arr.push(req.query.selectedLots);
  var filter = {};
  if (req.query.auctionId) {
    filter.auctionId = req.query.auctionId;
  }
  if (req.query.selectedLots) {
    //console.log("selectedLots",req.body.selectedLots);
    filter["selectedLots.lotNumber"] = {
      $in: arr
    }
  }
  console.log("filter for checking EmdData", filter);

  var data = req.query.selectedLots;


  if (data instanceof Array) {
    var lots = data;
  } else {

    var lots = [data];
  }
  console.log("lots", lots);
 async.series([function(next){
  fetchEmdAmount(filter,res,next);
},function(next){
    calculateEmdAmount(lots,filter,next);
  }],function(err,results){
  if(err)
    res.status(err.status || 500).send(err);
  console.log("results",results[1]);
  return res.json(results[1]); 
 });

}

function fetchEmdAmount(filter,res,callback){
var query = Emd.find(filter);
  query.exec(function(err, result) {
    if (err) {
      callback(err);
    }
    console.log("emdresult", result);
    if(result.length > 0){
      return res.json(result);
    }
    else{
    return callback(null,result);
  }
  });
}

function calculateEmdAmount(lots,filter,callback){
  var emdamount = []; 
  async.each(lots, function(item, cb) {
      //filter.auctionId = req.query.auctionId;
      filter["selectedLots.lotNumber"] = [];
      filter["selectedLots.lotNumber"].push(item);
      console.log("item", filter);
      Emd.find(filter, function(err, result) {
        if (result.length > 0) {
          emdamount.push(result[0].amount);
        }
        cb(null);
      });
    },
    function(err) {
      if(err)
        callback(err);
      console.log("emdAmount",emdamount);
      return callback(null,arraySum(emdamount));
    });
}



function arraySum(array) {
  var total = 0,
    len = array.length;

  for (var i = 0; i < len; i++) {
    total += parseInt(array[i]);

  }
  return total;
};

exports.destroy = function(req, res, next) {
  Emd.findById(req.params.id, function(err, oneRow) {
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

function handleError(res,err){
  return res,status(500).json(err);
}