'use strict';

var _ = require('underscore');
var Lot = require('./lot.model');
var AuctionMaster = require('../auction/auctionmaster.model');
var AuctionRequest = require('../auction/auction.model');
var async = require('async');
var APIError = require('../../components/_error');
var Util = require('../../components/utility');
var validator = require('validator');
var moment = require("moment");
var __ = require('lodash');
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];
  
  exports.create = function(req, res, next) {
    _getRecord(req.body, function(err, result) {
      if (err) {
        return handleError(res, err);
      }
      if (result.length > 0)
        return res.status(201).json({errorCode: 1,message: "Data already exist with same auction id and lot number!"});
        //return next(new ApiError(409, "Data already exist with same auction id and lot number!"));
      else
        create();
    });

    function create() {
      if (req.body.auction_id)
        req.body.auction_id = req.body.auction_id;
      var model = new Lot(req.body);
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
    if (data._id)
      filter._id = data._id;
    if (data.lotNumber)
      filter.lotNumber = data.lotNumber;

    Lot.find(filter, function(err, result) {
      cb(err, result);
    });
  }

  function postRequest(req, res){
    var options = {};
    Lot.find({
        _id: req.body._id,
      }, function(err, lotResult) {
        options.dataToSend = lotResult[0].toObject();
        options.dataType = "lotData";
        Util.sendCompiledData(options, function(err, result) {
          //options.dataToSend.auction_id = lotResult[0].auction_id;
          if (err || (result && result.err)) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
            update(options.dataToSend);
            if(result && result.err)
              return res.status(412).send(result.err);
            return res.status(412).send("Unable to post lot request. Please contact support team.");
          }

          if(result){
            options.dataToSend.reqSubmitStatus =  ReqSubmitStatuses[0];
            update(options.dataToSend);
            return res.status(201).json({errorCode: 0,message: "Lot request submitted successfully !!!"});
          }
        });
      });
  }

  function update(lotReq){
    var id = lotReq._id;
    delete lotReq._id;
    Lot.update({_id:id},{$set:{"reqSubmitStatus":lotReq.reqSubmitStatus}},function(err,retVal){
      if (err) { console.log("Error with updating lot request"); }
    console.log("Auction Lot Updated");
    }); 
  }

  exports.sendReqToCreateLot=function(req,res){
    postRequest(req, res);
  };

exports.updateLotData = function(req, res) {
  var options = {};
  req.body.updatedAt = new Date();

  if (req.body.auction_id)
    req.body.auction_id = req.body.auction_id;

  var filter = {};
  filter.isDeleted = false;
  if (req.body.auction_id)
    filter.auction_id = req.body.auction_id;
  if (req.body.lotNumber)
    filter.lotNumber = req.body.lotNumber;

  Lot.find(filter, function(err, lotResult) {
    if (err) return handleError(res, err);
    if(lotResult.length > 0){
      return res.status(201).json({errorCode: 1,message: "Data already exist with same auction id and lot number!"});
    } else {
      delete req.body._id;
      Lot.update({_id: req.params.id}, {$set: req.body}, function(err) {
        if (err)
          return res.status(412).send("Unable to update lot request. Please contact support team.");
        
        options.dataToSend = req.body;
        options.dataToSend._id = req.params.id;
        options.dataType = "lotData";
        Util.sendCompiledData(options, function(err, result) {
          if (err || (result && result.err)) {
            //options.dataToSend = lotResult[0].toObject();
            options.dataToSend.reqSubmitStatus =  ReqSubmitStatuses[1];

            update(options.dataToSend);
            if(result && result.err)
              return res.status(412).send(result.err);
            return res.status(412).send("Unable to update lot request. Please contact support team.");
          }
          if(result){
            options.dataToSend.reqSubmitStatus =  ReqSubmitStatuses[0];
            update(options.dataToSend);
            return res.status(201).json({errorCode: 0,message: "Lot request updated successfully !!!"});
          }
        });
      });
    }
  });
};

exports.updateProductLotData = function(req, res) {
  var options = {};
  req.body.updatedAt = new Date();
  if (req.body.hasOwnProperty('auctionId')) {
    req.body.auction_id = req.body.auctionId;
    delete req.body.auctionId;
  }
  Lot.update({
    "_id": req.params.id
  }, {
    $set: req.body
  }, function(err) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    options.dataToSend = req.body;
    options.dataType = "lotData";
    Util.sendCompiledData(options, function(err, result) {
      if (err) return handleError(res, err);
    });
    return res.status(200).json(req.body);
  });
};

/*exports.updatelotsisdeleted = function(req, res) {
  Lot.update({}, {
      $set: {
        "isDeleted": false
      }
    }, {
      multi: true
    })
    .exec(function(err, result) {
      if (err) return handleError(res, err);
      return res.status(200).json({
        message: "updated Successfully"
      });
    });
}*/

exports.getLots = function(req, res) {
  async.series([function(next) {
      fetchLotData(next);
    },
    function(next) {
      fetchAuctions(next);
    },
    function(next) {
      compileData(next);
    }
  ], function(err, results) {
    if (err) handleError(res, err);

    return res.json(results[2]);
  })
};

var lotsDataInAuctions = [];
var lotsData = [];

function fetchLotData(callback) {
  var filter = {};
  filter.isDeleted = false;
  Lot.find(filter, function(err, lots) {
    if (err) callback(err);
    lots = JSON.parse(JSON.stringify(lots));
    lots.forEach(function(item) {
      if (item.auction_id && validator.isMongoId(item.auction_id))
        lotsDataInAuctions.push(item.auction_id)
      item.lot_mongo_id = item._id;
      item.lot_startDate = item.startDate;
      item.lot_endDate = item.endDate;
      item.lot_bidIncrement = item.bidIncrement;
      item.lot_static_increment = item.static_increment;
      item.lot_lastMintBid = item.lastMintBid;
      item.lot_extendedTo = item.extendedTo;
    })
    lotsData = lots;
    return callback(null);
  });
}
var auctionsData = [];

function fetchAuctions(callback) {
  var filter = {};
  AuctionMaster.find({
    "_id": {
      $in: lotsDataInAuctions
    },
    'auctionType': {
      $ne: "S"
    },
    'isDeleted': false
  }, function(err, auctions) {
    if (err) return callback(err);
    try {
      auctions = JSON.parse(JSON.stringify(auctions));
    } catch (e) {
      return callback(null);
    }
    auctionsData = auctions;
    return callback(null);
  });
}


function compileData(callback) {
  var mergedList = _.map(lotsData, function(item) {
    return _.extend(item, _.findWhere(auctionsData, {
      "_id": item.auction_id
    }));
  });
  return callback(null, mergedList);
}


exports.getLotData = function(req, res) {
  var filter = {};
  filter.isDeleted = false;
  
  if (req.query.searchStr) {
       filter['$text'] = {
        '$search': "\""+req.query.searchStr+"\""
      }
  }
  if (req.query.auction_id) {
    filter.auction_id = req.query.auction_id;
  }
  if (req.query.auctionId) {
    filter.auctionId = req.query.auctionId;
  }
  if (req.query._id)
    filter._id = req.query._id;
  if (req.query.lot)
    filter.lotNumber = req.query.lot;

  if (req.query.pagination) {
    Util.paginatedResult(req, res, Lot, filter, {});
    return;
  }

  var query = Lot.find(filter).sort({createdAt: -1});
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    return res.status(200).json(result);
  });
};

exports.getLotsInAuction = function(req, res) {
  var options = {};
  //filter.isDeleted = false;
  var queryParam = req.query;
  //filter.auction_id = queryParam._id;
  async.series([
    function(next) {
      fetchLots(options, next);
    },
    function(next) {
      fetchAssetsInLot(options, next);
    },
    function(next) {
      viewData(options, next);
    }
  ], function(err, results) {
    if (err) return handleError(res, err);
    if (results && results.length && results[2]) {
      return res.status(200).json(results[2]);
    }

  });

  function fetchLots(options, callback) {
    var filter = {};
    filter.isDeleted = false;
    if(queryParam._id)
      filter.auction_id = queryParam._id;
    if(queryParam.lotId)
      filter['_id'] = queryParam.lotId;
    Lot.find(filter, function(err, result) {
      if (err) callback(err);
      if (result.length > 0) {
          options.lotData = result;
        return callback(null, options);
      } else {
        return callback(new APIError(404, 'Lot not found'));
      }
  });
}

function fetchAssetsInLot(options, callback) {
  var lotsIdArray = [];
  options.lotData.forEach(function(lot) {
    lotsIdArray.push(lot._id);
  });
  var filter = {isDeleted:false};
  filter['product.isSold'] = false;
  filter['lot_id'] = {'$in': lotsIdArray};
  if(queryParam.category)
    filter['product.category'] = queryParam.category;
  if(queryParam.brand)
    filter['product.brand'] = queryParam.brand;
  if (queryParam.assetId)
    filter["product.assetId"] = queryParam.assetId;
  if (queryParam.location) {
    var cityRegex = new RegExp(queryParam.location, 'i');
    filter['product.city'] = {$regex:cityRegex};
  }
  if(queryParam.mfgYearMax || queryParam.mfgYearMin){
    var mfgFilter = {};
    if(queryParam.mfgYearMin){
      mfgFilter['$gte'] = parseInt(queryParam.mfgYearMin);
    }
    if(queryParam.mfgYearMax){
      mfgFilter['$lte'] = parseInt(queryParam.mfgYearMax);
    }
    filter["product.mfgYear"] = mfgFilter;
 }

  AuctionRequest.find(filter, function(err, results) {
    if (err) callback(err);
    //if(results.length > 0){
      options.assetData = results;
      return callback(null, options);
  //}
  //else
    //return callback(new Error({message:"No assets in auction"}));
  });
}



function viewData(options, callback) {
    //var lotObj = {};
    //var obj = [];
    var resultArr = [];

    /*options.assetData.forEach(function(asset) {
      asset.lotNumber = lotInfo[asset.lot_id].lotNumber;
    });*/

    options.lotData.forEach(function(lot){
        lot = lot.toObject();
        lot.assets = [];
        options.assetData.forEach(function(x){
          x = x.toObject();
          if(x.lot_id === lot._id + "")
            lot.assets.push(x);
        });
        if(lot.assets.length)
          resultArr.push(lot);
    });

    //options.assetData.forEach(function(x) {
      //x = x.toObject();

      /*if (!lotObj[x.lotNumber]) {
        lotObj[x.lotNumber] = {};
        //lotObj['lotNumber'] = lotInfo[x.lot_id].lotNumber;
        lotObj[x.lotNumber]['assetDescription'] = [];
        lotObj[x.lotNumber].assetDir = x.product.assetDir;
        if (x.primaryImg !== "")
          lotObj[x.lotNumber].primaryImg = x.product.primaryImg;
      }
      lotObj[x.lotNumber].assetDescription.push(x.product.assetId);
      lotObj[x.lotNumber].amount = lotInfo[x.lot_id].amount;
      lotObj[x.lotNumber].id = x.lot_id;*/
    //});

    return callback(null, resultArr);
  };

}

//var lotInfo = {};


/*
lot master:

{
_id :1
lotNumber :1
fausfduy:
}

asset 

{
  lot_id : 1,sdhciysdfcui

}

lotInfo[1] =   




*/

exports.destroy = function(req, res) {
  //var options = {};
  Lot.findOneAndUpdate({_id: req.params.id}, {"$set": {"isDeleted": true}})
    .exec(function(err, doc) {
      if (err)
        return handleError(res, err);
      var options = {};
      options.dataToSend = {
        "_id": req.params.id,
        "isDeleted": true,
        "auction_id": req.body.auction_id
      }
      options.dataType = "lotData";
      Lot.find({'_id': req.params.id}, function(err, lotResult) {
        Util.sendCompiledData(options, function(err, result) {
          if (err || (result && result.err)) {
              //options.dataToSend.isDeleted = false;
              //update(options.dataToSend);
              Lot.update({_id:req.params.id},{$set:{"isDeleted":false}}).exec();
              if(result && result.err) {
                return res.status(412).send(result.err); 
              }
              AuctionRequest.update({'lot_id': req.params.id, 'auction_id':lotResult[0].auction_id}, {$set: {'isDeleted': false}}, {multi: true}, function(aucErr, resultData) {
                if (aucErr)
                  return handleError(res, err);
                return res.status(200).send("Unable to delete lot request. Please contact support team.");
              });
            }
            if(result){
              //options.dataToSend.isDeleted = true;
              //update(options.dataToSend);
              Lot.update({_id:req.params.id},{$set:{"isDeleted":true}}).exec();
              AuctionRequest.update({'lot_id': req.params.id, 'dbAuctionId':lotResult[0].auction_id}, {$set: {'isDeleted': true}}, {multi: true}, function(aucErr, resultData) {
                if (aucErr)
                  return handleError(res, err);
                return res.status(200).send({errorCode: 0,message: "Lot master deleted sucessfully!!!"});
              });
            }
        });
      });
    });
};
exports.removeLotData = function(req, res) {
  var field = {};
  if (req.body.flag == 1) {
    field = {
      "static_increment": 1
    };
  }
  if (req.body.flag == 2) {
    field = {
      "bidIncrement": 1
    };
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

var LOT_HEADER = {
  "Serial No." : {key:"serialNo"},
  "Auction ID":{key:"auctionId"},
  "Lot Number":{key:"lotNumber"},
  "Start Price":{key:"startingPrice"},
  "Reserve Price":{key:"reservePrice"},
  "Lot Start Date" : {key : "startDate",type:"date"},
  "Lot Start Time" : {key : "startDate",type:"time"},
  "Lot End Date" : {key : "endDate",type:"date"},
  "Lot End Time" : {key : "endDate",type:"time"},
  "Last Minute Bid":{key:"lastMinuteBid"},
  "Extended To" : {key : "extendedTo"},
  "Bid Increment Type" : {key : "bidIncrementType"},
  "Static" :{key : "static_increment"}
}

var  BID_HEADER = {
  "Bid From" : "bidFrom",
  "Bid To" : "bidTo",
  "Bid Increment" : "bidIncrement"
}

exports.exportCSV = function(req,res){
  var query = Lot.find({isDeleted:false}).sort({auction_id:-1,_id:-1});
  query.exec(function(err,lots){
    if(err) return handleError(err);
    var csvStr = "";
    var lotHeader = Object.keys(LOT_HEADER);
    var dataHeader = Object.keys(BID_HEADER);
    csvStr += lotHeader.join(",");
    csvStr += ","
    csvStr += dataHeader.join(",");
    csvStr += "\r\n";
    lots.forEach(function(lot,index){
      var rowData = [];
      lotHeader.forEach(function(header){
        var key = LOT_HEADER[header]["key"];
        var val = __.get(lot,key,"");
        if(key === "serialNo")
          val = (index + 1) + ".1";

        if(key === "bidIncrementType")
          val = lot.static_increment?"Static":"Bid Range";
        if(LOT_HEADER[header]["type"] && val && LOT_HEADER[header]["type"] === 'date')
           val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
        if(LOT_HEADER[header]["type"]&& val && LOT_HEADER[header]["type"] === 'time'){
           val = moment(val).utcOffset('+0530').format("h:mm a");
        }
          
        val = Util.toCsvValue(val);
        rowData.push(val);
      });
      if(!lot.static_increment && lot.bidIncrement && lot.bidIncrement.length){
        lot.bidIncrement.forEach(function(bidInc,idx){
          var row = [].concat(rowData);
          row[0] = (index + 1 ) + "." + (idx + 1);
          dataHeader.forEach(function(key){
            var bidVal = __.get(bidInc,BID_HEADER[key],"");
            bidVal = Util.toCsvValue(bidVal);
            row.push(bidVal);
          });
          csvStr += row.join(",");
          csvStr += "\r\n";
        });
      }else{
        csvStr += rowData.join(",");
        csvStr += "\r\n";
      }
    });
    csvStr = csvStr.substring(0,csvStr.length -1);
    try{
      req.filename = "lotmaster";
      renderCsv(req,res,csvStr);
    }catch(e){

    }
  });
}

function renderCsv(req,res,csv){
   var fileName = req.filename + "_" + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary'); 
}

function handleError(res, err) {
  return res.status(404).json(err);
}