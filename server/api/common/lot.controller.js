'use strict';

var _ = require('underscore');
var Lot = require('./lot.model');
var AuctionMaster = require('../auction/auctionmaster.model');
var AuctionRequest = require('../auction/auction.model');
var async = require('async');
var APIError = require('../../components/_error');
var Util = require('../../components/utility');
var validator = require('validator');
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
  Lot.find({_id: req.params.id}, function(err, lotResult) {
    if (err) return handleError(res, err);
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

exports.updatelotsisdeleted = function(req, res) {
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
}

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
  var filter = {};
  filter.isDeleted = false;
  filter.auction_id = req.query._id;
  async.series([
    function(next) {
      fetchLots(filter, options, next);
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
}

var lotInfo = {};

function fetchLots(filter, options, callback) {
  filter.isDeleted = false;
  Lot.find(filter, function(err, result) {
    if (err) callback(err);
    if (result.length > 0) {
      options.lotData = result;
      result.forEach(function(x) {
        lotInfo[x._id] = {};
        lotInfo[x._id].lotNumber = x.lotNumber;
        lotInfo[x._id].amount = x.startingPrice;
      });
      return callback(null, options);
    } else {
      return callback(new APIError(404, 'No Assets present in the auction'));
    }
  });
}

function fetchAssetsInLot(options, callback) {
  var lotsIdArray = [];
  options.lotData.forEach(function(lot) {
    lotsIdArray.push(lot._id);
  });
  AuctionRequest.find({
    lot_id: {
      '$in': lotsIdArray
    },
    isDeleted: false
  }, function(err, results) {
    if (err) callback(err);
    if(results.length > 0){
      options.assetData = results;
    return callback(null, options);
  }
  else
    return callback(new Error({message:"No assets in auction"}));
  });
}



function viewData(options, callback) {
  var lotObj = {};
  var obj = [];
  options.assetData.forEach(function(asset) {
    asset.lotNumber = lotInfo[asset.lot_id].lotNumber;
  });

  options.assetData.forEach(function(x) {
    if (!lotObj[x.lotNumber]) {
      lotObj[x.lotNumber] = {};
      //lotObj['lotNumber'] = lotInfo[x.lot_id].lotNumber;
      lotObj[x.lotNumber]['assetDescription'] = [];
      lotObj[x.lotNumber].assetDir = x.product.assetDir;
      if (x.primaryImg !== "")
        lotObj[x.lotNumber].primaryImg = x.product.primaryImg;
    }
    lotObj[x.lotNumber].assetDescription.push(x.product.assetId);
    lotObj[x.lotNumber].amount = lotInfo[x.lot_id].amount;
    lotObj[x.lotNumber].id = x.lot_id;
  });

  return callback(null, lotObj);
};


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

function handleError(res, err) {
  return res.status(404).json(err);
}