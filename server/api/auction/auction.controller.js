'use strict';

var _ = require('lodash');
var Seq = require("seq");
var trim = require('trim');
var AuctionRequest = require('./auction.model');
var AuctionMaster = require('./auctionmaster.model');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var ApiError = require('./../../components/_error.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var Product = require('./../product/product.model');
var PaymentMasterModel = require('../common/paymentmaster.model');
var Lot = require('../common/lot.model');
var vendorModel = require('../vendor/vendor.model');
var LotModel = require('../common/lot.model');

// Get list of auctions

var APIError = require('../../components/_error');
var async = require('async');
var debug = require('debug')('api.auction');
var uploadReqCtrl = require('../common/uploadrequest/uploadrequest.controller');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'];
var validTimeFormat = ['DD/MM/YYYY h:mmA', 'DD/MM/YYYY h:mm A', 'MM/DD/YYYY h:mm A'];
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];

var dateUtil = {
  validateAndFormatDate: function (dateString, format) {
    var dateFormat = format || 'YYYY-MM-DD HH:mm:ss';
    var formattedDate = moment(dateString, format).format(dateFormat);
    if (formattedDate === 'Invalid date') {
      formattedDate = null;
    }
    return formattedDate;
  },
  isValidDateTime: function (dateTimeString, format) {
    if (!dateTimeString)
      return { _isValid: false }
    return moment(dateTimeString, format);
  }
}

exports.getAll = function (req, res) {
  var filter = {};
  filter.isDeleted = false;
  if (req.query.auctionId) {
    filter.auctionId = req.query.auctionId;

  }
  AuctionRequest.find(filter, function (err, auctions) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(auctions);
  });
};

// Get a single auction
exports.getOnId = function (req, res) {
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if (err) {
      return handleError(res, err);
    }
    if (!auction) {
      return res.status(404).send('Not Found');
    }
    return res.json(auction);
  });
};

exports.getAuctionInfoForProduct = function (req, res) {
  AuctionRequest.findById(req.body._id, function (err, auction) {
    if (err) {
      return handleError(res, err);
    }
    if (!auction) {
      return res.status(404).send('Not Found');
    }
    var filter = {};
    filter._id = auction.dbAuctionId;
    var query = AuctionMaster.find(filter);
    var auctionData = {};
    query.exec(function (err, result) {
      if (err) {
        return handleError(res, err);
      }
      if (!result.length)
        return res.status(404).send("Auction not found");

      auctionData = result[0].toObject();
      var currentDate = new Date();
      auctionData.visibleBuyNow = true;
      if (auctionData.startDate < currentDate && auctionData.endDate > currentDate)
        auctionData.visibleBuyNow = false;
      auctionData.allowProxyBid = false;
      if (auctionData.insStartDate < currentDate && auctionData.endDate > currentDate)
        auctionData.allowProxyBid = true;
      return res.status(200).json(auctionData);
    });
  });
};

function _create(data, cb) {
  var assetIdExist = false;
  if (!data.product.assetId)
    return cb(new Error('Asset Id Missing'));

  Seq()
    .par(function () {
      var self = this;
      Product.find({
        assetId: data.product.assetId
      }, function (err, prds) {
        if (err) {
          return self(err)
        }
        if (prds.length > 0) {
          assetIdExist = true;
        }
        self();
      });
    })
    .par(function () {
      var self = this;
      AuctionRequest.find({
        "product.assetId": data.product.assetId,
        "isDeleted": false
      }, function (err, acts) {
        if (err) {
          self(err)
        }
        if (acts.length > 0) {
          assetIdExist = true;
        }
        self();
      });
    })
    .seq(function () {
      if (assetIdExist)
        return cb({
          errorCode: 1,
          message: "Duplicate asset id found."
        });
      data.createdAt = new Date();
      data.updatedAt = new Date();
      AuctionRequest.create(data, function (err, auctionAsset) {
        if (err) {
          //return new Error('Unable to create auction : ', data.auctionId);
          return cb('Unable to create auction' + data.auctionId);
        }
        //return cb({errorCode: 0,message: "Success."});

        //data._id = auction._id;
        var options = {};
        options.dataToSend = {};
        options.dataToSend._id = auctionAsset._id;
        options.dataToSend.assetId = auctionAsset.product.assetId;
        options.dataToSend.assetDesc = auctionAsset.product.description;
        options.dataToSend.auction_id = auctionAsset.dbAuctionId;
        options.dataToSend.auctionId = auctionAsset.auctionId;
        options.dataToSend.lot_id = auctionAsset.lot_id;
        options.dataToSend.assetDir = auctionAsset.product.assetDir;
        options.dataToSend.city = auctionAsset.product.city;

        options.dataToSend.primaryImg = config.awsUrl + config.awsBucket + "/assets/uploads/" + auctionAsset.product.assetDir + "/" + auctionAsset.product.primaryImg;
        if (auctionAsset.product.otherImages) {
          options.dataToSend.images = [];
          for (var i = 0; i < auctionAsset.product.otherImages.length; i++) {
            options.dataToSend.images[options.dataToSend.images.length] = config.awsUrl + config.awsBucket + "/assets/uploads/" + auctionAsset.product.assetDir + "/" + auctionAsset.product.otherImages[i];
          }
        } else
          options.dataToSend.images = [];

        options.dataToSend.seller = {};
        options.dataToSend.seller.contactNumber = auctionAsset.product.contactNumber;
        options.dataToSend.seller.contactName = auctionAsset.product.contactName;
        options.dataType = "assetData";

        Utility.sendCompiledData(options, function (err, result) {
          if (err || (result && result.err)) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
            updateAsset(options.dataToSend);
            //if (result && result.err)
            //return cb(result.err);
            //return cb({errorCode: 3,message: "Unable to post asset request. Please contact support team."});
            return cb(err);
          }
          if (result) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
            updateAsset(options.dataToSend);
            //return cb({errorCode: 0,message: "Asset request submitted successfully !!!"});
          }
          return cb();
        });
      });
    })
    .catch(function (err) {
      return cb(new Error(err || 'Unable to create'));
    })
}

// Creates a new valuation in the DB.
exports.create = function (req, res, next) {
  var assetIdExist = false;
  if (!req.body.product.assetId)
    return next(new ApiError(400, "Asset Id is mandatory"));

  Seq()
    .par(function () {
      var self = this;
      Product.find({
        assetId: req.body.product.assetId
      }, function (err, prds) {
        if (err) {
          return self(err)
        }
        if (prds.length > 0) {
          assetIdExist = true;
        }
        self();

      });
    })
    .par(function () {
      var self = this;
      AuctionRequest.find({
        "product.assetId": req.body.product.assetId,
        "isDeleted": false
      }, function (err, acts) {
        if (err) {
          self(err)
        }
        if (acts.length > 0) {
          assetIdExist = true;
        }
        self();
      });
    })
    .seq(function () {
      if (assetIdExist)
        return res.status(201).json({
          errorCode: 1,
          message: "Duplicate asset id found."
        });
      req.body.createdAt = new Date();
      req.body.updatedAt = new Date();
      AuctionRequest.create(req.body, function (err, auction) {
        //return res.status(201).json({errorCode: 0,message: "Success."});
        req.body._id = auction._id;
        postRequestAsset(req, res);
      });
    })
    .catch(function (err) {
      return handleError(res, err);
    })
}

function postRequestAsset(req, res) {
  var options = {};
  AuctionRequest.find({
    _id: req.body._id
  }, function (err, proResult) {
    options.dataToSend = {};
    if (req.body.isDeleted)
      options.dataToSend.isDeleted = true;
    options.dataToSend._id = req.body._id;
    if (!proResult[0].external)
      options.dataToSend._id = req.body.product._id;
    options.dataToSend.assetId = req.body.product.assetId;
    options.dataToSend.assetDesc = req.body.product.description;
    options.dataToSend.auction_id = req.body.dbAuctionId;
    options.dataToSend.auctionId = req.body.auctionId;
    options.dataToSend.lot_id = req.body.lot_id;
    options.dataToSend.assetDir = req.body.product.assetDir;
    options.dataToSend.city = req.body.product.city;
    options.dataToSend.primaryImg = config.awsUrl + config.awsBucket + "/assets/uploads/" + req.body.product.assetDir + "/" + req.body.product.primaryImg;
    if (req.body.product.otherImages) {
      options.dataToSend.images = [];
      for (var i = 0; i < req.body.product.otherImages.length; i++) {
        options.dataToSend.images[options.dataToSend.images.length] = config.awsUrl + config.awsBucket + "/assets/uploads/" + req.body.product.assetDir + "/" + req.body.product.otherImages[i];
      }
    } else
      options.dataToSend.images = [];
    if (proResult[0].external) {
      options.dataToSend.seller = {};
      options.dataToSend.seller.contactNumber = req.body.product.contactNumber;
      options.dataToSend.seller.contactName = req.body.product.contactName;
    }
    options.dataType = "assetData";

    Utility.sendCompiledData(options, function (err, result) {
      if (err || (result && result.err)) {
        options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
        updateAsset(options.dataToSend);
        if (result && result.err)
          return res.status(412).send(result.err);
        return res.status(412).send("Unable to post asset request. Please contact support team.");
      }
      if (result) {
        options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
        updateAsset(options.dataToSend);
        if (req.body.isDeleted)
          return res.status(201).json({ errorCode: 0, message: "Asset deleted successfully !!!" });
        else if (req.isUpdate)
          return res.status(201).json({ errorCode: 0, message: "Asset request updated successfully  !!!" });
        else
          return res.status(201).json({ errorCode: 0, message: "Asset request submitted successfully !!!" });
      }
    });
  });
}

function updateAsset(assetReq) {
  var id = assetReq._id;
  delete assetReq._id;
  AuctionRequest.update({ _id: id }, { $set: { "reqSubmitStatus": assetReq.reqSubmitStatus } }, function (err, retVal) {
    if (err) { console.log("Error with updating auction request"); }
    console.log("Asset updated Updated");
  });
}

exports.reSendReqToCreateAsset = function (req, res) {
  if (!req.body.external) {
    var options = {};
    options.dataToSend = {};
    var auctionReqId = req.body.assetReqId;
    var productId = req.body._id;
    if (req.body.assetReqId)
      delete req.body.assetReqId;
    if (req.body._id)
      delete req.body._id;
    if (req.body.external)
      delete req.body.external;
    options.dataToSend = req.body;
    options.dataToSend._id = productId;
    options.dataType = "assetData";

    Utility.sendCompiledData(options, function (err, result) {
      if (err || (result && result.err)) {
        Product.findOneAndUpdate({ _id: productId }, { $set: { "reqSubmitStatus": ReqSubmitStatuses[1] } }).exec();
        AuctionRequest.findOneAndUpdate({ _id: auctionReqId }, { $set: { "reqSubmitStatus": ReqSubmitStatuses[1] } }).exec();
        return res.status(201).json({ errorCode: 1, message: "Unable to post asset request. Please contact support team." });
      }
      if (result) {
        Product.findOneAndUpdate({ _id: productId }, { $set: { "reqSubmitStatus": ReqSubmitStatuses[0] } }).exec();
        AuctionRequest.findOneAndUpdate({ _id: auctionReqId }, { $set: { "reqSubmitStatus": ReqSubmitStatuses[0] } }).exec();
        return res.status(201).json({ errorCode: 0, message: "Asset request submitted successfully" });
      }
    });
  } else
    postRequestAsset(req, res);
};

function validateData(data) {
  var manadatoryParams = ['auctionId', 'lotNo', 'assetId', 'category', 'brand', 'model'];
  //var numericParams = ['lotNo', 'assetId'];
  var err = '';
  var missingParams = [];
  //var nonNumericParams = [];
  manadatoryParams.forEach(function (x) {
    if (!data[x] || (data.product && !data.product[x]))
      missingParams.push(x);
  });

  if (data.isSold && data.isSold.replace(/[^a-zA-Z ]/g, "").trim().toLowerCase() === 'yes') {
    if (!data.saleVal)
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

exports.bulkCreate = function (data, cb) {
  var errObj = [],
    sucessObj = [];

  // data = data.filter(function(x) {
  //   var err = validateData(x);
  //   if (err) {
  //     errObj.push({
  //       data: x,
  //       error: err
  //     });
  //   } else
  //     return x;
  // });

  if (data.length) {
    //AA:If the length of data is non zero
    //insert data asynchronously in mongodb
    async.eachLimit(data, 5, iteration, finalize);
  } else {
    console.log('No data for create');
    return {
      errObj: errObj,
      sucessObj: sucessObj
    }
  }

  function iteration(auctionData, next) {
    _create(auctionData, function (response) {
      // AuctionRequest.create(auctionData, function(err, auction) {
      if (response instanceof Error) {
        errObj.push({
          data: auctionData,
          error: response
        })
      } else {
        sucessObj.push(auctionData);
      }

      return next();
    });
  }

  function finalize(err) {
    if (err)
      debug(err);

    if (errObj.length && !sucessObj.length)
      return cb({
        Error: 'Error while inserting these data:' + errObj.toString(),
        errObj: errObj
      });

    if (sucessObj.length && !errObj.length)
      return cb(null, {
        Error: '',
        sucessObj: sucessObj
      });

    if (errObj.length && sucessObj.length)
      return cb({
        Error: 'Error while inserting these data:' + errObj.toString() +
          'Inserted Successfully:' + sucessObj.toString(),
        sucessObj: sucessObj,
        errObj: errObj
      });
  }

}

exports.bulkUpload = function (req, res, next) {
  var fileName = req.body.filename;
  var user = req.body.user;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    debug(e);
    return next(new APIError(400, 'Error while parsing excel sheet'));
  }

  if (!workbook)
    return next(new APIError(404, 'No Excel sheet found for upload'));

  var worksheet = workbook.Sheets[workbook.SheetNames[0]];
  var data = xlsx.utils.sheet_to_json(worksheet);
  var field_map = {
    'Auction_ID*': 'auctionId',
    'End_Date': 'endDate',
    'Asset_No.*': 'assetId',
    'Lot_No.*': 'lotNo',
    'Category*': 'category',
    'Brand*': 'brand',
    'Model*': 'model',
    'Asset_Description': 'description',
    'Invoice_Date': 'invioceDate',
    'Asset_Registration_No.': 'registrationNo',
    'Engine_No.': 'engineNo',
    'Asset_Location': 'city',
    'Original_Invoice': 'originalInvoice',
    'GST%': 'vatPercentage',
    'Contact_Person': 'contactName',
    'Contact_No.': 'contactNumber',
    'Product_ID': 'productId',
    'Sold': 'isSold',
    'Sale Value': 'saleVal',
    'Start_Date': 'startDate'
  };

  var err;
  var uploadData = [];
  var errObj = [];
  var assetIdMap = {};

  data.forEach(function (x) {
    var obj = {};
    Object.keys(x).forEach(function (key) {
      obj[field_map[key]] = x[key];
    })
    obj.rowCount = x.__rowNum__;
    err = validateData(obj);
    if (err) {
      errObj.push({
        Error: err,
        rowCount: x.__rowNum__
      });
    } else {
      if (assetIdMap[obj.assetId]) {
        errObj.push({
          Error: 'Duplicate Asset Id in uploaded sheet',
          rowCount: obj.rowCount
        })
      } else {

        assetIdMap[obj.assetId] = obj.auctionId;
        obj.user = user;

        ['isSold', 'originalInvoice'].forEach(function (x) {
          if (obj[x] && obj[x].replace(/[^a-zA-Z ]/g, "").trim().toLowerCase() !== 'yes') {
            obj[x] = false;
          }
        })

        if (!obj.isSold) {
          obj.saleVal = '';
        }

        if (!obj.originalInvoice) {
          obj.invioceDate = '';
        }

        uploadData.push(obj);
      }
    }
  });

  if (!uploadData.length) {
    var result = {
      errObj: errObj
    };

    return res.json(result);
  }

  uploadReqCtrl.create({
    uploadData: uploadData,
    type: 'auction'
  }, function (err, result) {
    if (err)
      return res.sendStatus(500).send(err);
    if (errObj.length)
      result.errObj = result.errObj.concat(errObj);

    return res.json(result);
  });
};

//search based on filter
exports.getOnFilter = function (req, res) {
  var filter = {};

  var orFilter = [];
  filter.isDeleted = false;
  if (req.body.searchStr) {

    var term = new RegExp(req.body.searchStr, 'i');
    orFilter[orFilter.length] = {
      "product.name": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.assetId": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.productId": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.description": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.category": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.brand": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.model": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.engineNo": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.registrationNo": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.invoiceDate": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.originalInvoice": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.contactNumber": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "product.contactName": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      auctionId: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      lotNo: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      status: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "valuation.status": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "seller.name": {
        $regex: term
      }
    };

  }

  if (orFilter.length > 0) {
    filter['$or'] = orFilter;
  }

  if (req.body.location) {
    var cityRegex = new RegExp(req.body.location, 'i');
    filter['product.city'] = { $regex: cityRegex };
  }

  if (req.body._id)
    filter["_id"] = req.body._id;
  if (req.body.userId)
    filter["user._id"] = req.body.userId;
  if (req.body.auctionId)
    filter["auctionId"] = req.body.auctionId;
  if (req.body.dbAuctionId)
    filter["dbAuctionId"] = req.body.dbAuctionId;
  if (req.body.valuationId)
    filter["valuation._id"] = req.body.valuationId;
  if (req.body.tid)
    filter["transactionId"] = req.body.tid;
  if (req.body.assetId)
    filter["product.assetId"] = req.body.assetId;
  if (req.body.category)
    filter["product.category"] = req.body.category;
  if (req.body.brand)
    filter["product.brand"] = req.body.brand;
  if (req.body.model)
    filter["product.model"] = req.body.model;
  if (req.body.group)
    filter["product.group"] = req.body.group;
  if (req.body.notInSoldPro)
    filter["product.isSold"] = { $ne: true };

  if (req.body.mfgYear) {
    var mfgYear = false;
    var mfgFilter = {};
    if (req.body.mfgYear.min) {
      mfgFilter['$gte'] = req.body.mfgYear.min;
      mfgYear = true;
    }
    if (req.body.mfgYear.max) {
      mfgFilter['$lte'] = req.body.mfgYear.max;
      mfgYear = true;
    }
    if (mfgYear)
      filter["product.mfgYear"] = mfgFilter;
  }

  if (req.body.mfgYearMax || req.body.mfgYearMin) {
    var mfgFilter = {};
    if (req.body.mfgYearMin) {
      mfgFilter['$gte'] = parseInt(req.body.mfgYearMin);
    }
    if (req.body.mfgYearMax) {
      mfgFilter['$lte'] = parseInt(req.body.mfgYearMax);
    }
    filter["product.mfgYear"] = mfgFilter;
  }
  if (req.body.status)
    filter["status"] = req.body.status;
  if (req.body.external)
    filter["external"] = req.body.external == 'y' ? true : false;
  if (req.body.pagination) {
    Utility.paginatedResult(req, res, AuctionRequest, filter, {});
    return;
  }
  var query = AuctionRequest.find(filter);
  query.exec(
    function (err, auctions) {
      if (err) {
        return handleError(res, err);
      }
      req.auctionReqs = auctions;
      filterInActiveProduct(req, res);
      //return res.status(200).json(auctions);
    }

  );
};

function filterInActiveProduct(req, res) {
  var assetIds = [];
  req.auctionReqs.forEach(function (item) {
    if (item.product && item.product._id)
      assetIds.push(item.product._id);
  });
  if (!assetIds.length)
    return res.status(200).json(req.auctionReqs);

  Product.find({ _id: { $in: assetIds } }, function (err, products) {
    if (err) return handleError(res, err);
    products.forEach(function (item) {
      if (!item.status || item.deleted) {
        for (var i = 0; i < req.auctionReqs.length; i++) {
          if (req.auctionReqs[i].product._id === item._id)
            req.auctionReqs.splice(i, 1);
        }
      } else if (item.status && !item.deleted) {
        for (var i = 0; i < req.auctionReqs.length; i++) {
          if (req.auctionReqs[i].product._id === (item._id && item._id.toString())) {
            ['operatingHour'].forEach(function (x) {
              if (item[x]) {
                req.auctionReqs[i].product[x] = item[x];
              }
            })
          }
        }
      }
    });
    return res.status(200).json(req.auctionReqs);
  });
}

// Updates an existing auction in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  req.body.updatedAt = new Date();
  AuctionRequest.find({
    "product.assetId": req.body.product.assetId,
    "status": "request_approved",
    "isDeleted": false
  }, function (err, auctions) {
    if (err) {
      return handleError(res, err);
    }
    /*if (auctions.length == 0) {
      return res.status(404).send("Not Found.");
    }*/
    if (auctions.length > 1 || (auctions.length == 1 && auctions[0]._id != req.params.id)) {
      return res.status(201).json({
        errorCode: 1,
        message: "Duplicate asset id found."
      });
    }
    AuctionRequest.update({
      _id: req.params.id
    }, {
        $set: req.body
      }, function (err) {
        if (err) {
          return handleError(res, err);
        }
        if (!req.body.external && req.body.product.isSold)
          updateProduct(req.body);

        req.body._id = req.params.id;
        req.isUpdate = true;
        postRequestAsset(req, res);
        //return res.status(200).json(req.body)
      });
  });
};

function updateProduct(data) {
  Product.find({ assetId: data.product.assetId }, function (err, product) {
    var proData = {};
    proData.isSold = true;
    proData.assetStatus = "sold";
    var stObj = {};
    if (data.user && data.user._id)
      stObj.userId = data.user._id;
    stObj.status = "sold";
    stObj.createdAt = new Date();
    if (!proData.assetStatuses)
      proData.assetStatuses = [];
    proData.assetStatuses[proData.assetStatuses.length] = stObj;
    Product.update({ assetId: data.product.assetId }, { $set: proData }, function (err) {
      if (err) { console.log("err", err); }
      console.log("Product Updated");
    });
  });
}

// Deletes a auction from the DB.
exports.destroy = function (req, res) {
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if (err) {
      return handleError(res, err);
    }
    if (!auction) {
      return res.status(404).send('Not Found');
    }
    auction.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(204).send('No Content');
    });
  });
};

function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}



function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function setType(cell) {
  if (typeof cell.v === 'number')
    cell.t = 'n';
  else if (typeof cell.v === 'boolean')
    cell.t = 'b';
  else if (cell.v instanceof Date) {
    cell.t = 'n';
    cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  } else cell.t = 's';
}

function setCell(ws, cell, R, C) {
  setType(cell);
  var cell_ref = xlsx.utils.encode_cell({
    c: C,
    r: R
  })
  ws[cell_ref] = cell;
}

function excel_from_data(data, isAdmin) {
  var ws = {};
  var range;
  range = {
    s: {
      c: 0,
      r: 0
    },
    e: {
      c: 14,
      r: data.length
    }
  };

  for (var R = 0; R != data.length + 1; ++R) {
    var C = 0;
    var auction = null;
    if (R != 0)
      auction = data[R - 1];
    var cell = null;
    if (R == 0)
      cell = {
        v: "Auction Id"
      };
    else {
      if (auction)
        cell = {
          v: auction.auctionId
        };
    }

    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Asset Id"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.assetId || ""
        };
    }
    setCell(ws, cell, R, C++);


    if (R == 0)
      cell = {
        v: "Product Id"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.productId || ""
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Seller Name"
      };
    else {
      if (auction && auction.seller)
        cell = {
          v: auction.seller.name || ""
        };
      else
        cell = {
          v: ""
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Asset Name"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.name
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Manufacturer"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.brand
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Model"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.model
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Manufaturing Year"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.mfgYear
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "City"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.city
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Machine Serial No."
      };
    else {
      if (auction)
        cell = {
          v: auction.product.serialNumber || ""
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Price (Excl. Tax)"
      };
    else {
      if (auction)
        cell = {
          v: auction.product.grossPrice || ""
        };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = {
        v: "Start Date"
      };
    else {
      if (auction)
        cell = {
          v: auction.startDate
        };
    }

    setCell(ws, cell, R, C++);
    if (R == 0)
      cell = {
        v: "End Date"
      };
    else {
      if (auction)
        cell = {
          v: auction.endDate
        };
    }
    setCell(ws, cell, R, C++);

  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

exports.exportAuction = function (req, res) {
  var filter = {};
  var isAdmin = true;
  if (req.body.userid) {
    filter["user._id"] = req.body.userid;
    isAdmin = false;
  }
  if (req.body.ids)
    filter['_id'] = {
      $in: req.body.ids
    };
  var query = AuctionRequest.find(filter).sort({
    auctionId: 1
  });
  query.lean().exec(
    function (err, auctions) {
      if (err) {
        return handleError(res, err);
      }
      try {
        return _prepareCSVResponse(res, auctions);
      } catch (exp) {
        return handleError(res, exp);
      }
    });
}

function _prepareCSVResponse(res, auctions) {
  var tempData = [];
  try {
    auctions.forEach(function (item, key, array) {
      delete array[key]._id;
      let obj = {
        "Auction Id": item.auctionId,
        "Asset Id": item.product['assetId'],
        "Product Id": item.product['productId'] || "",
        "Seller Name": item.seller ? item.seller['name'] || "" : "",
        "Asset Name": item.product['name'] || "",
        "Manufacturer": item.product['brand'] || "",
        "Model": item.product['model'] || "",
        "Manufacturing Year": item.product['mfgYear'] || "",
        "City": item.product['city'] || "",
        "Machine Serial No.": item.product['serialNumber'] || "",
        "Price (Excl. Tax)": item.product['grossPrice'] || "",
        "Start Date": item.startDate || "",
        "End Date": item.endDate || "",
      }
      tempData.push(obj);
    });
    Utility.convertToCSV(res, tempData);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

//Auction master services

// Creates a new AuctionMaster in the DB.
exports.createAuctionMaster = function (req, res) {
  //var options = {};
  var filter = {}
  if (!req.body.auctionId)
    return res.status(401).send('Insufficient data');

  //if(req.body.entityName)
  filter.auctionId = req.body.auctionId;
  filter.isDeleted = false;
  //var term = new RegExp("^" + req.body.entityName + "$", 'i');
  AuctionMaster.find(filter, function (err, auctionData) {
    if (err) return handleError(res, err);
    if (auctionData.length > 0) {
      return res.status(200).json({
        errorCode: 1,
        message: "Auction Id already exist."
      });
    } else {

      AuctionMaster.create(req.body, function (err, auctionData) {
        if (err) {
          return handleError(res, err);
        }
        req.body._id = auctionData._id;
        postRequest(req, res);
      });
    }
  });

};

function postRequest(req, res) {
  var options = {};
  AuctionMaster.find({
    _id: req.body._id
  }, function (err, result) {
    options.dataToSend = result[0].toObject();
    options.dataType = "auctionData";

    Utility.sendCompiledData(options, function (err, result) {
      if (err || (result && result.err)) {
        //options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
        req.body.reqSubmitStatus = ReqSubmitStatuses[1];
        update(req.body);
        if (result && result.err)
          return res.status(412).send(result.err);
        return res.status(412).send("Unable to post auction request. Please contact support team.");
      }
      if (result) {
        //options.dataToSend.reqSubmitStatus =  ReqSubmitStatuses[0];
        req.body.reqSubmitStatus = ReqSubmitStatuses[0];
        update(req.body);
        return res.status(201).json({ errorCode: 0, message: "Auction request submitted successfully !!!" });
      }
    });
  });
}

function update(auctionReq) {
  var _id = auctionReq._id;
  delete auctionReq._id;
  AuctionMaster.update({ _id: _id }, { $set: { "reqSubmitStatus": auctionReq.reqSubmitStatus } }, function (err, retVal) {
    if (err) { console.log("Error with updating auction request"); }
    console.log("Auction Request Updated");
  });
}

exports.getAssetInfo = function (req, res) {
  var filter = {};
  var data = {};
  filter._id = req.query.dbAuctionId;
  filter.isDeleted = false;
  AuctionMaster.find(filter, function (err, results) {
    if (err) {
      return handleError(res, err);
    }

    if (results.length > 0) {
      if (results[0].auctionType === 'S')
        data.auctionType = results[0].auctionType;
      filter = {};
      filter.assetId = req.query.assetId;
      Product.update(filter, {
        $set: {
          "status": true
        }
      }, function (err, resproduct) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json({
          "message": "userActive"
        });
      });
    } else {
      return res.status(500).json({
        "message": "No Auction Data"
      });
    }
  });
};

exports.updateAuctionMasterproduct = function (req, res) {
  var _id = req.body._id;
  AuctionMaster.update({
    _id: _id
  }, {
      $set: req.body
    }, function (err) {
      if (err) {
        return handleError(res, err);
      }
      res.status(200).json({
        errorCode: 0,
        message: "Auction Data Successfully saved."
      });

    });

}
// Remove field from Auction Master
exports.removeAuctionMasterproduct = function (req, res) {
  var _id = req.body._id;
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
  AuctionMaster.update({
    _id: _id
  }, {
      $unset: field //{"static_increment":1}
    }, function (err) {
      if (err) {
        return handleError(res, err);
      }
      res.status(200).json({
        errorCode: 0,
        message: "Auction Data Successfully deleted."
      });

    });
}

exports.sendReqToCreateAuction = function (req, res) {
  postRequest(req, res);
};

// Creates a AuctionMaster in the DB.
exports.updateAuctionMaster = function (req, res) {
  var options = {};
  var _id = req.body._id;

  if (req.body._id) {
    delete req.body._id;
  }
  //if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  var filter = {}
  if (!req.body.auctionId)
    return res.status(401).send('Insufficient data');
  if (_id)
    filter['_id'] = {
      $ne: _id
    };
  if (req.body.auctionId)
    filter.auctionId = req.body.auctionId;
  filter.isDeleted = false;
  AuctionMaster.find(filter, function (err, auctionData) {
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
        }, function (err, resultData) {
          if (err) {
            return handleError(res, err);
          }
          req.body._id = req.params.id;
          postRequest(req, res);
        });
    }
  });
}

/*function updateAuctionRequest(data, id) {
  var dataToSet = {};
  dataToSet.auctionId = data.auctionId;
  dataToSet.startDate = data.startDate;
  dataToSet.endDate = data.endDate;
  AuctionRequest.update({
    dbAuctionId: id
  }, {
    $set: dataToSet
  }, {
    multi: true
  }, function(err, product) {
    if (err) {
      //console.log("Error with updating auction request");
    }
    //console.log("Auction Request Updated");
  });
}*/



//search AucyionMaster based on filter 
exports.getFilterOnAuctionMaster = function (req, res) {
  var searchStrReg = new RegExp(req.body.searchStr, 'i');
  var filter = {};
  filter.isDeleted = false;
  if (req.body._id)
    filter._id = req.body._id;
  if (req.body.userId)
    filter["user._id"] = req.body.userId;
  if (req.body.statusType)
    filter.auctionType = req.body.statusType;
  if (req.body.mobile)
    filter["user.mobile"] = req.body.mobile;
  if (req.body.auctionId)
    filter.auctionId = req.body.auctionId;
  // if(req.body.hasOwnProperty('isDeleted')){
  //   filter.isDeleted=req.body.isDeleted;
  // }
  if (req.body.emdTax)
    filter.emdTax = req.body.emdTax;
  /*if(req.body.statusType){
    filter["auctionType"]=req.body.statusType;
  }*/
  var currentDate = new Date();
  if (req.body.auctionType === 'closed') {
    //var currentDate = new Date();
    filter.endDate = {
      '$lt': currentDate
    }
  } else if (req.body.auctionType === 'upcoming') {
    //var currentDate = new Date();
    filter.endDate = {
      '$gt': currentDate
    };

    filter.auctionType = {
      '$ne': "S"
    };

  } else if (req.body.auctionType === 'expireauction') {
    //var currentDate = new Date();
    filter.endDate = {
      '$lt': currentDate
    };
    filter["_id"] = req.body._id;

  } else if (req.body.auctionType === 'upcomingauctions') {
    //var currentDate = new Date();
    filter.endDate = {
      '$gt': currentDate
    };
    filter.startDate = {
      '$gt': currentDate
    };

    filter.auctionType = {
      '$ne': "S"
    };
  } else if (req.body.auctionType === 'S') {
    //var currentDate = new Date();
    filter.auctionType = "S";
  }

  if (req.body.statusType === 'live')
    filter.auctionType = "L";

  if (req.body.statusType === 'online')
    filter.auctionType = "A";

  var arr = [];

  if (req.body.searchStr) {
    arr[arr.length] = {
      name: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      auctionId: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      auctionOwner: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      city: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      auctionAddr: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      auctionType: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      docType: {
        $regex: searchStrReg
      }
    };
    //arr[arr.length] = { regCharges: { $regex: searchStrReg }};

  }

  if (arr.length > 0)
    filter['$or'] = arr;
  var result = {};
  if (req.body.pagination && !req.body.statusType) {
    return Utility.paginatedResult(req, res, AuctionMaster, filter, {}, function (results) {
      if (req.body.addAuctionType) {
        result = auctionListing(results);
        return res.status(200).json(result);
      } else {
        return res.status(200).json(results);
      }
    });
  }
  var query = AuctionMaster.find(filter);
  query.exec(
    function (err, items) {
      if (err) {
        return handleError(res, err);
      }
      var result = {};
      if (req.body.addAuctionType) {
        result.items = items;
        result = auctionListing(result);
        return res.status(200).json(result);
      } else {
        result.items = items;
        return res.status(200).json(result);
      }
    });
};

function auctionListing(results) {
  var tempArr = [];
  var result = {};
  if (results) {
    results.items.forEach(function (auction) {
      auction = auction.toObject();
      var currentDate = new Date();
      var startDate = auction.startDate;
      var endDate = auction.endDate;
      auction.endTimer = endDate.getTime();
      var d = new Date();
      auction.startTimer = startDate.getTime();

      if (startDate > currentDate) {
        auction.auctionValue = "upcomingAuctions";
      } else if (startDate < currentDate && endDate > currentDate) {
        auction.auctionValue = "ongoingAuctions";
      } else if (endDate < currentDate) {
        auction.auctionValue = "closedAuctions";
      }
      tempArr[tempArr.length] = auction;
    })
  }
  result.items = tempArr;
  result.totalItems = results.totalItems;
  return result;
}

exports.getAuctionMasterCount = function (req, res) {
  var currentDate = new Date();
  var result = {};
  async.parallel([upcominAuctionCount, closedAuctionCount], function (err) {
    if (err) return handleError(res, err);
    res.status(200).json(result);
  })
  function upcominAuctionCount(cb) {
    var filter = {};
    filter.isDeleted = false;
    filter.endDate = { '$gt': currentDate };
    var query = AuctionMaster.find(filter).count();
    query.exec(function (err, upcomingCount) {
      if (!err && upcomingCount)
        result.upcomingCount = upcomingCount;
      return cb();
    });

  }

  function closedAuctionCount(cb) {
    var filter = {};
    filter.isDeleted = false;
    filter.endDate = { '$lt': currentDate };
    var query = AuctionMaster.find(filter).count();
    query.exec(function (err, closeCount) {
      if (!err && closeCount)
        result.closeCount = closeCount;
      return cb();
    });
  }
}

exports.getAuctionWiseProductData = function (req, res) {
  var filter = {};
  filter.isDeleted = false;
  if (req.body.auctionIds)
    filter['dbAuctionId'] = { $in: req.body.auctionIds };
  if (req.body.status)
    filter['status'] = req.body.status;
  var isClosed = req.body.isClosed;
  var auctions = [];
  var isSoldCount = 0;
  var result1 = [];
  var result2 = [];
  Seq()
    .par(function () {
      var self = this;
      filter['product.isSold'] = false;
      var query = AuctionRequest.aggregate([{ "$match": filter }, {
        "$group": {
          _id: "$dbAuctionId",
          total_products: {
            $sum: 1
          }
        }
      }]);
      query.exec(
        function (err, result) {
          if (err) {
            return next(err);
          }
          result1 = result;
          self();
        });

    })
    .par(function () {
      var self = this;
      if (isClosed === 'n')
        return self();
      filter['product.isSold'] = true;
      var query2 = AuctionRequest.aggregate([{
        "$match": filter,
      }, {
        "$group": {
          _id: "$dbAuctionId",
          isSoldCount: {
            "$sum": 1
          },
          sumOfInsale: {
            $sum: "$product.saleVal"
          }
        }
      }]);
      query2.exec(
        function (err, isSoldCount) {
          result2 = isSoldCount;
          self();

        });
    })
    .seq(function () {

      result1.forEach(function (x) {
        result2.some(function (y) {
          if (x._id === y._id) {
            x.isSoldCount = y.isSoldCount;
            x.sumOfInsale = y.sumOfInsale;
            return true;
          }
        })
      })
      return res.status(200).json(result1);
    })
    .catch(function (err) {
      return handleError(res, err);
    });
}

exports.auctiondetail = function (req, res) {
  var filter = {};
  var queryObj = req.query;
  var currentDate = new Date();
  filter.endDate = {
    '$lt': currentDate
  };

  filter._id = queryObj.auctionId;
  filter.isDeleted = false;
  var query = AuctionMaster.find(filter);
  query.exec(function (err, auctions) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(auctions);
  });

}

exports.getAuctionMaster = function (req, res) {
  var filter = {};
  var queryObj = req.query;
  filter.isDeleted = false;
  if (req.body._id) {
    filter._id = req.body._id;
  }

  if (queryObj.yetToStartDate) {
    filter.endDate = {
      '$gt': new Date()
    };

    filter.auctionType = {
      '$ne': "S"
    };
  }

  if (req.query.auctionId)
    filter.auctionId = req.query.auctionId;

  if (req.query._id)
    filter._id = req.query._id;

  if (queryObj.dbauctionId)
    filter._id = queryObj.dbauctionId;

  var query = AuctionMaster.find(filter).sort({
    createdAt: -1
  })
  query.exec(function (err, auctions) {
    if (err) {
      return handleError(res, err);
    }

    return res.status(200).json(auctions);
  });
}

exports.deleteAuctionMaster = function (req, res) {
  AuctionMaster.findOneAndUpdate({ _id: req.params.id }, { "$set": { "isDeleted": true } })
    .exec(function (err, doc) {
      if (err) {
        return handleError(res, err);
      }
      var options = {};
      options.dataToSend = {
        "_id": req.params.id,
        "isDeleted": true,
      }
      options.dataType = "auctionData";
      Utility.sendCompiledData(options, function (err, result) {
        if (err || (result && result.err)) {
          //options.dataToSend.isDeleted = false;
          //update(options.dataToSend);
          AuctionMaster.update({ _id: req.params.id }, { $set: { isDeleted: false } }).exec();
          if (result && result.err) {
            return res.status(412).send(result.err);
          }
          return res.status(412).send("Unable to delete auction request. Please contact support team.");
        }
        if (result) {
          //options.dataToSend.isDeleted = true;
          //update(options.dataToSend);
          AuctionMaster.update({ _id: req.params.id }, { $set: { isDeleted: true } }).exec();
          return res.status(201).json({ errorCode: 0, message: "Auction request deleted successfully !!!" });
        }
      });
    });
};

exports.importAuctionMaster = function (req, res) {
  var fileName = req.body.fileName;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    console.log(e);
    return handleError(res, "Error in file upload")
  }
  if (!workbook)
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];
  var data = xlsx.utils.sheet_to_json(worksheet);
  if (data.length === 0) {
    return res.status(500).send("There is no data in the file.");
  }
  var headers = ['Auction_Name*', 'Auction_Start_Date*', 'Auction_End_Date*', 'Auction_ID*', 'Auction_Start_Time*', 'Auction_End_Time*', 'Auction_Owner_Mobile*'];
  var date_params = ['Auction_Start_Date*', 'Auction_End_Date*'];
  var time_params = ['Auction_Start_Time*', 'Auction_End_Time*'];
  var time_params = ['Emd_Amount', 'Terms_Of_Auction', 'Contact_Person_Name', 'Contact_Person_No.'];
  var err = false;
  var hd = getHeaders(worksheet);
  if (!validateHeader(hd, headers)) {
    return res.status(500).send("Wrong template");
  }

  req.errors = [];
  req.totalRecords = data.length;
  data = data.filter(function (x) {
    headers.forEach(function (head) {
      if (!x[head]) {
        req.errors[req.errors.length] = {
          rowCount: x.__rowNum__,
          AuctionID: x['Auction_ID*'] || '',
          message: 'Missing mandatory params : ' + head
        }
        err = true;
      }

      if (date_params.indexOf(head) > -1 && !dateUtil.isValidDateTime(x[head], validDateFormat)._isValid) {
        req.errors[req.errors.length] = {
          rowCount: x.__rowNum__,
          AuctionID: x['Auction_ID*'] || '',
          message: 'Invalid Date format : ' + head
        }
        err = true;
      }

      if (time_params.indexOf(head) > -1 && !dateUtil.isValidDateTime(x[head], 'h:mmA')._isValid) {
        req.errors[req.errors.length] = {
          rowCount: x.__rowNum__,
          AuctionID: x['Auction_ID*'] || '',
          message: 'Invalid Time format : ' + head
        }
        err = true;
      }
    })

    if (!err) {
      return x;
    }
  })

  if (!data.length) {
    return res.status(201).json({
      errorCode: 1,
      message: 'Invalid Data in excel'
    });
  }

  req.counter = 0;
  req.numberOfCount = data.length;
  req.successCount = 0;
  req.groupId = new Date().getTime();
  importAuctionMaster(req, res, data);

}


function getHeaders(worksheet) {

  var headers = [];
  for (var z in worksheet) {
    if (z[0] === '!') continue;
    //parse out the column, row, and value
    var col = z.substring(0, 1);
    var row = parseInt(z.substring(1));
    var value = worksheet[z].v;
    //store header names
    if (row == 1) {
      headers[headers.length] = value;
    }
  }
  return headers;
}

function validateHeader(headersInFile, headers) {
  var ret = true;
  //ret = headersInFile.length == headers.length;
  // if (!ret)
  //   return ret;

  headers.some(function (x) {
    if (headersInFile.indexOf(x) < 0) {
      ret = false;
      return true;
    }
  })
  return ret;
}

// function isValid(d) {
//   return d.getTime() === d.getTime();
// }

function importAuctionMaster(req, res, data) {
  var errorObj = {};
  var ret = true;

  if (req.counter < req.numberOfCount) {
    var auctionData = {};
    var field_map = {
      'Auction_ID*': 'auctionId',
      'Auction_Name*': 'name',
      'Auction_Owner': 'auctionOwner',
      'Auction_Owner_Mobile*': 'auctionOwnerMobile',
      'Auction_Start_Date*': 'startDate',
      'Auction_Start_Time*': 'startTime',
      'Auction_End_Date*': 'endDate',
      'Auction_End_Time*': 'endTime',
      'Inspection_Start_Date': 'insStartDate',
      'Inspection_Start_Time': 'insStartTime',
      'Inspection_End_Date': 'insEndDate',
      'Inspection_End_Time': 'insEndTime',
      'Registration_End_Date': 'regEndDate',
      'Address_of_Auction': 'auctionAddr',
      'Emd_Amount': 'emdAmount',
      'Auction_Type': 'auctionType',
      'Location': 'city',
      'Terms_Of_Auction': 'termAuction',
      'Contact_Person_Name': 'contactName',
      'Contact_Person_No.': 'contactNumber'
    };

    var timeMap = {
      'startDate': 'startTime',
      'endDate': 'endTime',
      'insStartDate': 'insStartTime',
      'insEndDate': 'insEndTime'
    }

    Object.keys(field_map).some(function (x) {
      if (data[req.counter][x]) {
        auctionData[field_map[x]] = data[req.counter][x];

        if (x === 'Auction_Type') {
          auctionData.auctionType = data[req.counter][x].replace(/[^a-zA-Z ]/g, "").trim().toLowerCase();
          if (auctionData.auctionType !== 'live' && auctionData.auctionType !== 'online') {
            errorObj.rowCount = req.counter + 2;
            errorObj.AuctionID = auctionData.auctionId;
            errorObj.message = "Wrong value of auction type";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            ret = false;
            return true;
          }
        }
      }
    })

    var dateObj = ['startDate', 'endDate', 'insStartDate', 'insEndDate', 'regEndDate'];
    dateObj.forEach(function (x) {
      if (auctionData[x]) {
        var date = dateUtil.isValidDateTime(auctionData[x], validDateFormat);
        if (date._isValid) {
          auctionData[x] = moment(auctionData[x], date._f).format('MM/DD/YYYY');
          if (auctionData[timeMap[x]]) {
            date = dateUtil.isValidDateTime((auctionData[x] + ' ' + auctionData[timeMap[x]]), validTimeFormat);
            if (date._isValid) {
              auctionData[x] = date._d;
            }
          }
          auctionData[x] = new Date(auctionData[x]);
        } else {
          delete auctionData[x];
        }
      }
    })

    auctionData.groupId = req.groupId;

    if (!ret) {
      importAuctionMaster(req, res, data);
      return;
    }

    if (auctionData.emdAmount) {
      if (isNaN(auctionData.emdAmount)) {
        errorObj.rowCount = req.counter + 2;
        errorObj.AuctionID = auctionData.auctionId;
        errorObj.message = "Wrong value of EMD Amount";
        req.errors[req.errors.length] = errorObj;
        req.counter++;
        importAuctionMaster(req, res, data);
        return;
      } else {
        auctionData.emdAmount = Number(trim(auctionData.emdAmount));
      }
    }

    AuctionMaster.find({
      auctionId: auctionData.auctionId
    }, function (err, auction) {
      if (err)
        handleError(err);

      if (auction && auction.length) {
        errorObj.rowCount = req.counter + 2;
        errorObj.AuctionID = auctionData.auctionId;
        errorObj.message = "Auction with this AuctionID is already exist in Auction Master";
        req.errors[req.errors.length] = errorObj;
        req.counter++;
        importAuctionMaster(req, res, data);
        return;
      }

      if (auctionData.auctionOwnerMobile) {
        vendorModel.find({
          'user.mobile': auctionData.auctionOwnerMobile,
          services: 'Auction'
        }).exec(function (err, vendor) {
          if (err || !vendor) {
            handleError(err || 'Error while searching vendor');
          }

          if (!vendor.length) {
            errorObj.rowCount = req.counter + 2;
            errorObj.AuctionID = auctionData.auctionId;
            errorObj.message = "Auction owner is not exist";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importAuctionMaster(req, res, data);
            return;
          }

          //auctionData.auctionOwner = vendor[0].user.fname + ' ' + vendor[0].user.lname;
          auctionData.auctionOwner = vendor[0].entityName;
          insertData();
        })
      } else {
        insertData();
      }

      function insertData() {
        // PaymentMasterModel.findOne({serviceCode:'Auction'},function(error,regAmount){
        //   if(error)
        //      auctionData.emdAmount = 0;
        //   auctionData.regCharges = Number(regAmount.fees);
        AuctionMaster.create(auctionData, function (err, act) {
          if (err) {
            return handleError(res, err)
          } else {
            req.successCount++;
            req.counter++;
            importAuctionMaster(req, res, data);
          }
        })
        //})
      }
    })
  } else {
    res.status(200).json({
      errorCode: 0,
      errObj: req.errors,
      message: req.successCount.toString() + " out of " + req.totalRecords.toString() + " Uploaded Successfully"
    });
  }
}

/*exports.changeAuctionType = function(req, res) {
  var filter = {};
  filter.isDeleted = false;
  AuctionMaster.find(filter, function(err, auctions) {
    var auctionType = {};
    auctions.forEach(function(doc) {
      if (doc) {
        if (doc.auctionType == 'live') {
          auctionType = 'L';
          doc.update({
            $set: {
              auctionType: auctionType
            }
          }, function(err) {
            //return res.status(200).json(req.body);
          });
        }
        if (doc.auctionType == 'online') {
          auctionType = 'A';
          doc.update({
            $set: {
              auctionType: auctionType
            }
          }, function(err) {
            //return res.status(200).json(req.body);
          });

        }

      }
    });
    if (err) {
      return handleError(res, err);
    }
    //return res.status(200).json(auctions);
  });
};*/
/* end of auctionmaster */
var FIELDS = ['auction_id', 'lot_id', "lot_status"];
exports.validateUpdateLotStatus = function (req, res, next) {
  var bodyData = req.body;
  var result = {};
  result.err = "";
  result.results = "";

  for (var i = 0; i < FIELDS.length; i++) {
    if (!bodyData[FIELDS[i]]) {
      result.err = FIELDS[i] + " is missing";
      break;
    }
  }
  if (result.err)
    return sendResponse();
  if (['Closed', 'Sold'].indexOf(bodyData.lot_status) === -1) {
    result.err = "Invalid status";
    return sendResponse();
  }
  var parallelFns = [getLot];
  if (bodyData.lot_status === 'Sold')
    parallelFns[parallelFns.length] = getAssetInLot;

  async.parallel(parallelFns, function (err) {
    if (err) {
      result.err = err;
      return sendResponse();
    };
    var idArr = [];
    if (req.assets) {
      req.assets.forEach(function (item) {
        if (!item.external && item.product && item.product._id)
          idArr.push(item.product._id);
      });
    }

    Product.find({ _id: { $in: idArr }, deleted: false }, function (prErr, products) {
      if (err) {
        result.err = "Error in getting product";
        return sendResponse();
      }
      req.products = products;
      return next();
    });
  });

  function getLot(cb) {
    LotModel.find({ _id: bodyData.lot_id, status: true, isDeleted: false, lotStatus: 'Open' }, function (err, lots) {
      if (err)
        return cb("Error in finding lot");
      if (!lots.length)
        return cb("Lot not found");
      req.lot = lots[0];
      return cb();
    });
  }

  function getAssetInLot(cb) {
    AuctionRequest.find({ lot_id: bodyData.lot_id, dbAuctionId: bodyData.auction_id, isDeleted: false }, function (err, assets) {
      if (err)
        return cb("Error in asset lot");
      if (!assets.length)
        return cb("NO asset in lot");
      req.assets = assets;
      return cb();

    });
  };

  function sendResponse() {
    return res.status(200).json(result);
  }

};

exports.updateLotStatus = function (req, res) {
  var bodyData = req.body;
  var result = {};
  result.err = "";
  result.results = "";
  async.parallel([updateLot, updateAssetInAuction, updateProduct], function (err) {
    if (err)
      result.err = err;
    else
      result.results = "Lot status updated successfully";
    return res.status(200).json(result);

  });

  function updateLot(callback) {
    var updatedData = { lotStatus: bodyData.lot_status };
    updatedData.updatedAt = new Date();
    LotModel.update({ _id: bodyData.lot_id }, { $set: updatedData }, function (err) {
      if (err)
        return callback("Error in updating lot");
      return callback();
    });
  }

  function updateAssetInAuction(callback) {
    if (bodyData.lot_status === 'Closed')
      return callback();
    async.eachLimit(req.assets, 2, _updateAsset, function (err) {
      return callback(err);
    });

    function _updateAsset(data, cb) {
      data = data.toObject();
      var _id = data._id;
      delete data._id;
      if (data && data.product)
        data.product.isSold = true;
      AuctionRequest.update({ _id: _id + "" }, { $set: data }, function (err) {
        if (err) return cb("Error in asset in auction product update with id " + _id);
        return cb();
      });
    }
  }

  function updateProduct(callback) {
    if (bodyData.lot_status === 'Closed')
      return callback();
    async.eachLimit(req.products, 2, _updateProduct, function (err) {
      return callback(err);
    });

    function _updateProduct(data, cb) {
      if (data.assetStatus === 'sold')
        return cb();

      var updatedData = { updatedAt: new Date() };
      updatedData.isSold = true;
      updatedData.assetStatus = "sold";
      updatedData.assetStatuses = data.assetStatuses;
      if (!updatedData.assetStatuses || !updatedData.assetStatuses.length)
        updatedData.assetStatuses = [];
      var stsObj = {
        createdAt: new Date(),
        status: 'sold',
        userId: "Auction"
      };
      updatedData.assetStatuses[updatedData.assetStatuses.length] = stsObj;
      Product.update({ _id: data._id }, { $set: updatedData }, function (err) {
        if (err)
          return cb("Error in product update for id " + data._id);
        return cb();
      });
    }
  }
};

/* end of auctionmaster */
function handleError(res, err) {
  return res.status(500).send(err);
}
