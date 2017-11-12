'use strict';

var _ = require('lodash');
var Emd = require('./emd.model');
var ApiError = require('../../components/_error');
var async = require('async');
var Util=require('../../components/utility');
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];

  exports.create = function(req, res, next) {
    _getRecord(req.body, function(err, result) {
      if (err) {
        return handleError(res, err);
      }
      if (result.length > 0)
        return res.status(201).json({errorCode: 1,message: "Data already exist!"});
        //return next(new ApiError(409, "Data already exist with same auction id and lot number!"));
      else
        create();
    });

    function create() {
      if (req.body.auction_id)
        req.body.auction_id = req.body.auction_id;
      var model = new Emd(req.body);
      model.save(function(err, st) {
        if (err) {
          return handleError(res, err);
        }
        req.body._id = st._id;
        postRequest(req, res);
        //return res.status(200).json({message: "Data saved sucessfully"});
      });
    }
  };

  function _getRecord(data, cb) {
    var filter = {};
    filter.isDeleted = false;
    if (data.auction_id)
      filter.auction_id = data.auction_id;
    // if (data._id)
    //   filter._id = data._id;
     if (data.selectedLots && data.selectedLots.lotNumber) {
      filter["selectedLots.lotNumber"] = {
        $in: data.selectedLots.lotNumber
      }
    }

    Emd.find(filter, function(err, result) {
      cb(err, result);
    });
  }

  function postRequest(req, res){
    var options = {};
    Emd.find({
        "_id": req.body._id,
      }, function(err, result) {
        options.dataToSend = result[0].toObject();
        options.dataType = "emdData";
        Util.sendCompiledData(options, function(err, result) {
          if (err || (result && result.err)) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
            update(options.dataToSend);
            if(result && result.err)
              return res.status(412).send(result.err);
            return res.status(412).send("Unable to post EMD request. Please contact support team.");
          }
          if(result){
            options.dataToSend.reqSubmitStatus =  ReqSubmitStatuses[0];
            update(options.dataToSend);
            return res.status(201).json({errorCode: 0,message: "EMD request submitted successfully !!!"});
          }
        });
      });
  }

  function update(emdReq){
    var _id = emdReq._id;
    delete emdReq._id;
    Emd.update({_id:_id},{$set:emdReq},function(err,emdVal){
      if (err) {
      console.log("Error with updating lot request");
    }
    console.log("Auction EMD Updated");
    }); 
  }

  exports.sendReqToCreateEmd=function(req,res){
    postRequest(req, res);
  };
  
exports.updateEmdData = function(req, res) {
  var options={};
  options.dataToSend=req.body;
  req.body.updatedAt = new Date();
  if(req.body._id)
    delete req.body._id;
  
  Emd.find({_id: req.params.id}, function(err, emdResult) {
    if (err) return handleError(res, err);
    //var preData = lotResult;
    Emd.update({_id: req.params.id}, {$set: req.body}, function(err) {
      if (err)
        return res.status(412).send("Unable to update EMD request. Please contact support team.");
      
      options.dataToSend = req.body;
      options.dataToSend._id = req.params.id;
      options.dataType = "emdData";
      Util.sendCompiledData(options, function(err, result) {
        if (err || (result && result.err)) {
          update(emdResult[0].toObject());
          if(result && result.err)
            return res.status(412).send(result.err);
          return res.status(412).send("Unable to update EMD request. Please contact support team.");
        }
        if(result){
          return res.status(201).json({errorCode: 0,message: "EMD request updated successfully !!!"});
        }
      });
    });
  });
};

exports.getEmdData = function(req, res) {
  var filter = {};
  if (req.body._id) {
    filter["auction_id"] = req.body._id;
  }
  if (req.body.selectedLots && req.body.selectedLots.lotNumber) {
    filter["selectedLots.lotNumber"] = {
      $in: req.body.selectedLots.lotNumber
    }
  }
  filter.isDeleted=false;
  var query = Emd.find(filter).sort({createdAt: -1});
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    return res.json(result);
  });
};

exports.getEmdAmountData = function(req, res, callback){
  var arr=[]
  if(req.query.selectedLots)
    arr=req.query.selectedLots;
  var filter = {};
  if (req.query.auction_id) {
    filter.auction_id = req.query.auction_id;
  }
  if (req.query.selectedLots) {
    filter["selectedLots.lotNumber"] = {
      $eq: arr
    }
  }

  var data = req.query.selectedLots;
  if (data instanceof Array) {
    var lots = data;
  } else {
    var lots = [data];
  }
 async.series([function(next){
  fetchEmdAmount(filter,res,next);
},function(next){
    calculateEmdAmount(lots,filter,next);
  }],function(err,results){
  if(err)
    res.status(err.status || 500).send(err);
  return res.json(results[1]); 
 });
}

function fetchEmdAmount(filter,res,callback){
filter.isDeleted=false;
var query = Emd.find(filter);
  query.exec(function(err, result) {
    if (err) {
      callback(err);
    }
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
      filter.isDeleted=false;
      Emd.find(filter, function(err, result){
        if (result.length > 0) {
          emdamount.push(result[0].amount);
        }
        cb(null);
      });
    },
    function(err) {
      if(err)
        callback(err);
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

exports.destroy = function(req, res) {
  var options={};
  Emd.findOneAndUpdate({_id:req.params.id},{$set:{'isDeleted':true}}, function(err, data) {
    if (err)
      res.status(err.status || 500).send(err);
    
    options.dataToSend={};
    options.dataToSend={
      '_id':req.params.id,
      'isDeleted':true,
      'auction_id': req.body.auction_id,
      'selectedLots': req.body.selectedLots
    };
    
    options.dataType="emdData";
    Util.sendCompiledData(options,function(err,result){
      if (err || (result && result.err)) {
        options.dataToSend.isDeleted = false;
        update(options.dataToSend);
        if(result && result.err) {
          return res.status(412).send(result.err); 
        }
        return res.status(412).send("Unable to delete EMD request. Please contact support team.");
      }
      if(result){
        options.dataToSend.isDeleted = true;
        update(options.dataToSend);
          return res.status(200).send({errorCode: 0,message: "EMD master deleted sucessfully!!!"});
      }
    });
      // return res.status(200).send({
      //   message: "Data Successfully deleted!!!"
      // });
    });
};

function handleError(res,err){
  return res,status(500).json(err);
}