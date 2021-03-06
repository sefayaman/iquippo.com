'use strict';

var _ = require('lodash');
var Model = require('./userregisterforauction.model');
var ApiError = require('../../components/_error');
var User = require('./../user/user.model');
var Utility = require('./../../components/utility.js');
var PaymentTransaction = require('./../payment/payment.model');
var Seq = require('seq');
var xlsx = require('xlsx');
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];

exports.getFilterOnRegisterUser = function (req, res) {
  var filter = {};
  var orFilter = [];
  if (req.body.searchstr) {
    var term = new RegExp(req.body.searchstr, 'i');
    orFilter[orFilter.length] = {
      "auction.auctionId": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "auction.name": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.fname": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.lname": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.email": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.countryCode": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.mobile": {
        $regex: term
      }
    };
  }

  if (orFilter.length > 0) {
    filter.$or = orFilter;
  }
  if (req.body.auctionOwnerMobile)
    filter['auction.auctionOwnerMobile'] = req.body.auctionOwnerMobile;

  filter.status = true;

  if (req.body.pagination) {
    Utility.paginatedResult(req, res, Model, filter, {});
    return;
  }

  var query = Model.find(filter).sort({
    createdAt: -1
  });
  query.exec(
    function (err, auctions) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(auctions);
    }

  );
};

exports.checkUserRegis = function (req, res) {
  var arr = [];
  var filter = {};

  if (req.body.auction.dbAuctionId)
    filter['auction.dbAuctionId'] = req.body.auction.dbAuctionId;

  if (req.body.user._id)
    filter['user._id'] = req.body.user._id;

  if (req.body.user.mobile)
    filter['user.mobile'] = req.body.user.mobile;

  if (req.body.paymentMode)
    filter['user.mobile'] = req.body.paymentMode;

  if (req.body.emdTax)
    filter['auction.emdTax'] = req.body.emdTax;

  if (req.body.selectedLots) {
    if (!Array.isArray(req.body.selectedLots))
      arr = req.body.selectedLots.split(',');
    else
      arr = req.body.selectedLots;

    filter['selectedLots'] = {
      $in: arr
    }
  }
  var query = Model.find(filter);
  query.exec(
    function (err, data) {
      var filter = {};
      if (data && data.length > 0) {
        if (req.body.emdTax === 'lotwise') {
          if (req.body.checkRegUser) {
            var ids = [];
            data.forEach(function (item) {
              ids.push(item.transactionId);
            });
            filter._id = { $in: ids }
          } else
            return res.status(200).json(data);
        } else {
          if (data[0].transactionId)
            filter._id = data[0].transactionId;
        }
        PaymentTransaction.find(filter, function (err, payment) {
          if (err) { return handleError(res, err); }
          var message = {};
          if (!payment.length)
            return res.status(200).json({ errorCode: 2, message: "No Data Found" });
          if (req.body.onlyRegLotForUser) {
            var regResult = {};
            regResult.regLot = [];
            for (var i = 0; i < payment.length; i++) {
              if (payment[i].status === "completed") {
                for (var j = 0; j < payment[i].selectedLots.length; j++)
                  regResult.regLot.push(payment[i].selectedLots[j]);
              }
            }
            return res.status(200).json(regResult);
          }
          if (req.body.emdTax === 'lotwise') {
            var flag = false;
            for (var i = 0; i < payment.length; i++) {
              if (payment[i].status === "completed") {
                message.data = "done";
                message.errorCode = 0;
                flag = true;
                break;
              }
            }
            if (!flag) {
              message.data = "undone";
              message.errorCode = 1;
            }
            return res.status(200).json(message);
          } else {
            if (payment[0].status === "completed") {
              message.data = "done";
              message.errorCode = 0;
            } else {
              message.data = "undone";
              message.errorCode = 1;
            }
            message.selectedLots = data[0].selectedLots;
            message.transactionId = data[0].transactionId;
            return res.status(200).json(message);
          }
        });
      } else {
        return res.status(200).json({ errorCode: 2, message: "No Data Found" });
      }
    });
};

exports.saveOfflineRequest = function (req, res) {
  var trnId = req.body.transactionId;

  if (req.body.transactionId)
    delete req.body.transactionId;

  PaymentTransaction.findOneAndUpdate({ _id: trnId }, { $set: req.body }, function (err, dt) {
    if (err) { return handleError(res, err); }
    if (!dt) { return res.status(404).json({ errorCode: 1 }); }
    return res.status(200).json(dt);
  })
};

exports.sendUserToAs = function (req, res) {
  var options = {};
  options.dataToSend = req.body;
  options.dataType = "userInfo";
  Utility.sendCompiledData(options, function (err, result) {
    if (err) return handleError(res, err);
    if (result) {
      return res.status(200).json(result);
    } else {
      return new ApiError(409, "data not sent successfully");
    }
  });
};


exports.get = function (req, res) {
  var filter = {};
  if (req.query.transactionId)
    filter.transactionId = req.query.transactionId;
  Model.find(filter, function (err, userdata) {
    if (err) return handleError(res, err);
    if (userdata.length > 0) {
      return res.status(200).json(userdata);
    } else {
      return res.status(404).json({
        "msg": 'No transatcions'
      });
    }
  });
};

exports.create = function (req, res, next) {
  _getRecord(req.body, function (err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (result.length > 0)
      return next(new ApiError(409, "You have already register for this auction!!!"));
    else
      create();
  });

  function create() {
    ///
    Seq()
      .seq(function () {
        var self = this;
        /*if(!req.body.payment){
          self()
          return;
        }*/
        // req.body.payment.createdAt = new Date();
        //req.body.payment.updatedAt = new Date();
        //req.body.payment.totalAmount = req.body.totalAmount;
        PaymentTransaction.create(req.body, function (err, payment) {
          if (err) {
            return handleError(res, err);
          } else {
            req.transactionId = payment._id;
            self();
          }
        });
      })
      .seq(function () {
        var self = this;
        req.body.auction.createdAt = new Date();
        req.body.auction.updatedAt = new Date();
        req.body.transactionId = req.transactionId;
        var model = new Model(req.body);
        model.save(function (err, st) {
          if (err) {
            return handleError(res, err);
          }
          // return res.status(200).json({message:"Your request has been successfully submitted!"});
          var resObj = {}
          resObj.transactionId = req.transactionId;
          resObj.errorCode = 0;
          return res.status(200).json(resObj);

        });

      })
  }
};

function _getRecord(data, cb) {
  var filter = {};
  if (data.auction.dbAuctionId)
    filter['auction.dbAuctionId'] = data.auction.dbAuctionId;
  if (data.user._id)
    filter['user._id'] = data.user._id;
  if (data.user.mobile)
    filter['user.mobile'] = data.user.mobile;
  if (data.selectedLots) {
    filter['selectedLots'] = {
      $in: data.selectedLots
    }
  }
  Model.find(filter, function (err, result) {
    if (err) cb(err);
    return cb(null, result);
  });
}

exports.exportData = function (req, res) {
  var filter = {};
  if (req.body.auctionOwnerMobile) {
    filter['auction.auctionOwnerMobile'] = req.body.auctionOwnerMobile;
  }

  Model.find(filter).sort({ createdAt: -1 }).lean().exec(
    function (err, data) {
      if (err) {
        return handleError(res, err);
      }
      try {
        return _prepareResponse(res, data);
      } catch (exp) {
        return handleError(res, exp);
      }
    });
};

function _prepareResponse(res, data) {
  var tempData = [];
  data.forEach(function (item, key, array) {
    delete array[key]._id;
    tempData.push({
      "Sr. No": key + 1,
      "Auction Id": _.get(item, 'auction.auctionId', ''),
      "Auction Name": _.get(item, 'auction.name', ''),
      "EMD Amount": _.get(item, 'auction.emdAmount', ''),
      "Customer ID": _.get(item, 'user.customerId', ''),
      "User Name": item.user['fname'] + ' ' + item.user['lname'],
      "Mobile": _.get(item, 'user.mobile', ''),
      "Email": _.get(item, 'user.email', ''),
      "Date of Request": Utility.toDanishDate(_.get(item, 'createdAt'))
    });
  });

  try {
    Utility.convertToCSV(res, tempData);
  } catch (excp) {
    throw excp;
  }
}

function handleError(res, err) {
  return res.status(500).send(err);
}