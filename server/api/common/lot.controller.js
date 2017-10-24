'use strict';

var _ = require('underscore');
var Lot = require('./lot.model');
var AuctionMaster = require('../auction/auctionmaster.model');
var AssetsInAuction = require('../product/productlotmap.model');
var async = require('async');
var ApiError = require('../../components/_error');
var Util = require('../../components/utility');
var validator = require('validator');

exports.create = function(req, res) {
  //console.log("I am here 1",req.body);
  var options = {};
  async.series({
    saveLot: function(callback) {
      //console.log("I am here save");
      if (req.body.hasOwnProperty('auctionId')) {
        req.body.auction_id = req.body.auctionId;
        delete req.body.auctionId;
      }
      var model = new Lot(req.body);
      model.save(function(err, st) {
        if (err) return callback(err);
        options.dataToSend = st;
        //console.log("I am here savelot");
        return callback(null, {
          message: "Data saved successfully",
          lotData: st
        });
      });
    }
  }, function(err, results) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    console.log("results", results);
    //console.log("options data lot",options);
    options.dataType = "lotData";
    Util.sendCompiledData(options, function(err, result) {
      if (err) return handleError(res, err);
      console.log(result);
    });
    return res.status(200).json(results.saveLot);
  });
};

exports.updateLotData = function(req, res) {
  var options = {};
  req.body.updatedAt = new Date();
  if (req.body.hasOwnProperty('auctionId')) {
    req.body.auction_id = req.body.auctionId;
    delete req.body.auctionId;
  }
  delete req.body._id;
  Lot.update({
    _id: req.params.id
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
      console.log(result);
    });
    return res.status(200).json(req.body);
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
      console.log(result);
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
console.log("getLots");  
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
    console.log("results", results[2]);
    return res.json(results[2]);
  })
};

var lotsDataInAuctions = [];
var lotsData = [];
function fetchLotData(callback) {
  var filter = {};
  filter.isDeleted = false;
  console.log("fetchLots");
  Lot.find(filter, function(err, lots) {
    if (err) callback(err);
    /*lotsData=lots;
    var obj={};
    lotsData.forEach(function(l){
     obj=JSON.parse(JSON.stringify(l));
     newLots.push(obj);
    })*/
    lots=JSON.parse(JSON.stringify(lots));
    lots.forEach(function(item){
      if(item.auction_id && validator.isMongoId(item.auction_id))
        lotsDataInAuctions.push(item.auction_id)
    })
    lotsData=lots;
    console.log("lotsAuct",lotsData);
    console.log("lotsAuct",lotsDataInAuctions);
    return callback(null);
  });
}
var auctionsData = [];

function fetchAuctions(callback) {
  var filter = {};
  console.log("filter",filter);
  AuctionMaster.find({"_id":{$in:lotsDataInAuctions},'auctionType':{$ne:"S"},'isDeleted':false}, function(err, auctions) {
    if (err) return callback(err);
    /*auctionsData = auctions;*/
    try{
    auctions=JSON.parse(JSON.stringify(auctions));  
    }
    catch(e){
      return callback(null);
    }
    auctionsData=auctions;
    console.log("auctions", auctionsData);
    return callback(null);
  });
}



function compileData(callback) {
/*auctionsData.forEach(function(item){
      obj=JSON.parse(JSON.stringify(item));
      console.log("The item",obj);
      newAuction.push(obj);
    });
  console.log("array",newAuction);*/
  var mergedList = _.map(lotsData, function(item) {
    return _.extend(item, _.findWhere(auctionsData, {
      "_id":item.auction_id
    }));
  });
  console.log("mergedList",mergedList);
  return callback(null, mergedList);
}


exports.getLotData = function(req, res) {

  var filter = {};
  var query = {};
  console.log("req.query", req.query);
  if (req.query.hasOwnProperty('isDeleted'))
    filter.isDeleted = req.query.isDeleted;
  if (req.query.auctionId) {
    filter.auction_id = req.query.auctionId;
  }
  if (req.query._id)
    filter._id = req.query._id;
  if (req.query.lot)
    filter.lotNumber = req.query.lot;

  console.log("the filter", filter);
  query = Lot.find(filter);
  query.exec(function(err, result) {
    if (err) {
      res.status(err.status || 500).send(err);
    }
    //console.log("lot result", result);
    return res.status(200).json(result);
  });
};

exports.getLotsInAuction = function(req, res) {
  var options = {};
  var filter = {};
  //console.log("req.query", req.query);
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
      console.log("The data", results[2]);
      return res.status(200).json(results[2]);
    }

  });
}

var lotInfo = {};

function fetchLots(filter, options, callback) {
  Lot.find(filter, function(err, result) {
    if (err) callback(err);
    if (result.length > 0) {
      console.log("lots", result);
      options.lotData = result;
      result.forEach(function(x) {
          lotInfo[x._id] = {};
          lotInfo[x._id].lotNumber = x.lotNumber;
          lotInfo[x._id].amount = x.startingPrice;
        });
        console.log("info",lotInfo);
      return callback(null, options);
    } else {
      return callback(null, {
        msg: 'No Lots present in the auction '
      });
    }
  });
}

function fetchAssetsInLot(options, callback) {
  var lotsIdArray = [];
  options.lotData.forEach(function(lot) {
    lotsIdArray.push(lot._id);
  });
  AssetsInAuction.find({
    lot_id: {
      '$in': lotsIdArray
    },
    isDeleted: false
  }, function(err, results) {
    if (err) callback(err);
    options.assetData = results;
    //console.log("assets",results);
    return callback(null, options);
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
    }
    lotObj[x.lotNumber].assetDescription.push(x.assetId);
    lotObj[x.lotNumber].amount = lotInfo[x.lot_id].amount;
    lotObj[x.lotNumber].id = x.lot_id;
    if (x.primaryImg !== "")
      lotObj[x.lotNumber].primaryImg = x.primaryImg;
    console.log("object of me", x.primaryImg);
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
  var options = {};
  console.log("id", req.params.id);
  Lot.update({
      _id: req.params.id
    }, {
      "$set": {
        "isDeleted": true
      }

    })
    .exec(function(err, doc) {
      if (err) {
        return handleError(res, err);
      }
      options = {};
      options.dataToSend = {
        "_id": req.params.id,
        "isDeleted": true
      }
      options.dataType = "lotData";
      Util.sendCompiledData(options, function(err, result) {
        if (err) return handleError(res, err);
        console.log("result", result);
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
  return res.status(500).json(err);
}