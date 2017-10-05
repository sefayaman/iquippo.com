'use strict';

var _ = require('lodash');
var Seq = require("seq");
var trim = require('trim');
var FinanceMaster = require('./financemaster.model');
//var LeadMaster = require('./leadmasterdata.model');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var ApiError = require('./../../components/_error.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";

// Get list of auctions

var APIError = require('../../components/_error');
var async = require('async');
var debug = require('debug')('api.finance');
var uploadReqCtrl = require('../common/uploadrequest/uploadrequest.controller');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD'];
var validTimeFormat = ['DD/MM/YYYY h:mmA','DD/MM/YYYY h:mm A','MM/DD/YYYY h:mm A'];

var dateUtil = {
  validateAndFormatDate: function(dateString, format) {
    var dateFormat = format || 'YYYY-MM-DD HH:mm:ss';
    var formattedDate = moment(dateString,format).format(dateFormat);
    if (formattedDate === 'Invalid date') {
      formattedDate = null;
    }
    return formattedDate;
  },
  isValidDateTime: function(dateTimeString, format) {
    if(!dateTimeString)
      return {_isValid : false}
    return moment(dateTimeString,format);
  }
}

exports.getAll = function(req, res) {
  FinanceMaster.find(function(err, finance) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(finance);
  });
};



// Get a single auction
exports.getOnId = function(req, res) {
  FinanceMaster.findById(req.params.id, function(err, auction) {
    if (err) {
      return handleError(res, err);
    }
    if (!auction) {
      return res.status(404).send('Not Found');
    }
    return res.json(auction);
  });
};




function validateData(data) {
  var manadatoryParams = ['auctionId', 'lotNo', 'assetId', 'category', 'brand', 'model'];
  //var numericParams = ['lotNo', 'assetId'];
  var err = '';
  var missingParams = [];
  //var nonNumericParams = [];
  manadatoryParams.forEach(function(x) {
    if (!data[x] || (data.product && !data.product[x]))
      missingParams.push(x);
  });

  if(data.isSold && data.isSold.replace(/[^a-zA-Z ]/g, "").trim().toLowerCase() === 'yes' ){
    if(!data.saleVal)
      missingParams.push('Sale Value');
  }

  if (missingParams.length) {
    err = 'Missing Parameters: ' + missingParams.join(',');
    return err;
  }

  // numericParams.forEach(function(x) {
  //   if (isNaN(data[x]) || isNaN(data.product[x]))
  //     nonNumericParams.push(x);
  // });

  // if (missingParams.length) {
  //   err = 'Should be Numeric: ' + nonNumericParams.join(',');
  // }

  return err;
}





// Updates an existing finance in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  req.body.updatedAt = new Date();
  FinanceMaster.update({
      _id: req.params.id
    }, {
      $set: req.body
    }, function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json({
          errorCode: 0,
          message: "Success"
        });
    //});
  });
};


function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}


//Auction master services

// Creates a new AuctionMaster in the DB.
exports.createFinanceMaster = function(req, res) {
  var filter = {}
   FinanceMaster.create(req.body, function(err, financeData) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json({
          errorCode: 0,
          message: ""
        });
      });
  };

// Creates a FinanceMaster in the DB.
exports.updateFinanceMaster = function(req, res) {
  var _id = req.body._id;
  if (req.body._id) {
    delete req.body._id;
  }
  //if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  var filter = {}
  /*if (!req.body.auctionId)
    return res.status(401).send('Insufficient data');
  if (_id)
    filter['_id'] = {
      $ne: _id
    };*/
 /* if (req.body.auctionId)
    filter['auctionId'] = req.body.auctionId;
  FinanceMaster.find(filter, function(err, financeData) {
    if (err) return handleError(res, err);
    if (auctionData.length > 0) {
      return res.status(200).json({
        errorCode: 1,
        message: "Auction Id already exist."
      });
    } else {
      AuctionMaster.update({
        _id: _id
      }, {
        $set: req.body
      }, function(err) {
        if (err) {
          return handleError(res, err);
        }
        updateAuctionRequest(req.body, _id);
        return res.status(200).json({
          errorCode: 0,
          message: "Success"
        });
      });
    }
  });*/
   FinanceMaster.Update(req.body, _id);
        return res.status(200).json({
          errorCode: 0,
          message: "Success"
        });
}

//search FinanceMaster based on filter 
exports.getFilterOnFinanceMaster = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchStr, 'i');
  var filter = {};
  if (req.body._id)
    filter["_id"] = req.body._id;
  if (req.body.url)
    filter["url"] = req.body.url;
  if(req.body.type)
    filter.type = req.body.type;
  if(req.body.image){
    filter["image"]=req.body.image;
  }
  /* var currentDate = new Date();
  if (req.body.auctionType === 'closed'){
    //var currentDate = new Date();
    filter.endDate={
      '$lt': currentDate
    }
  } else if(req.body.auctionType === 'upcoming') {
    //var currentDate = new Date();
    filter.endDate={
    '$gt': currentDate
    };
  }else if(req.body.auctionType === 'upcomingauctions') {
    //var currentDate = new Date();
    filter.endDate={
    '$gt': currentDate
    };
   filter.startDate={
    '$gt': currentDate
    };
    
  }*/

  var arr = [];

  if (req.body.searchStr) {
    arr[arr.length] = {
      type: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      url: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      image: {
        $regex: searchStrReg
      }
    };

  }

  if (arr.length > 0)
    filter['$or'] = arr;

  var result = {};

if (req.body.pagination && !req.body.statusType) {
    return Utility.paginatedResult(req, res, FinanceMaster, filter, {},function(results){
      if(req.body.addAuctionType) {
      result= results;
       return res.status(200).json(result);
      }
      else{
        return res.status(200).json(results);
      } 
    });
}

 var query = FinanceMaster.find(filter);
  query.exec(
    function(err, items) {
      if (err) {
        return handleError(res, err);
      }
      var result={};
        result.items=items;
       return res.status(200).json(result);   
    });
};


exports.getFinanceMaster = function(req, res) {console.log("vinay====");
  var filter = {};
  //{$and:[{startDate:{$lte:new Date()}},{endDate:{$gte:new Date()}}]}
  filter['$and'];
  filter.startDate={
    '$lte': new Date()
  }; 
  filter.endDate={
    '$gte': new Date()
    }; 
  var queryObj = req.query;
  /*if (queryObj.yetToStartDate)
    filter['startDate'] = {
      '$gt': new Date()
    }*/
  var query = FinanceMaster.find(filter).sort({
    _id: -1
  })
  query.exec(function(err, finances) {
    if (err) {
      return handleError(res, err);
    }console.log("=====",finances);
    return res.status(200).json(finances);
  });
}

exports.deleteFinanceMaster = function(req, res) {
  FinanceMaster.find({_id: req.params.id})
    .remove()
      .exec(function(err, doc) {
        if (err) {
          return handleError(res, err);
        }
       return res.status(200).send({
           errorCode: 0,
           message: "Finance master deleted sucessfully!!!"
        });
  });
};

exports.rapitApi = function(req, res) {
  var filter = {};
 
 LeadMaster.create(req.body, function(err, leadData) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json({
          errorCode: 0,
          message: "Save succesfully."
        });
      });
}
/* end of financemaster */
function handleError(res, err) {
  return res.status(500).send(err);
}


