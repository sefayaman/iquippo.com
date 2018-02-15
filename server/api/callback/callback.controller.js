'use strict';

var _ = require('lodash');
var Callback = require('./callback.model');
var Utility = require('./../../components/utility.js');
var xlsx = require('xlsx');

// Get list of callback
exports.getAll = function (req, res) {
  Callback.find(function (err, callback) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(callback);
  });
};

// Get a single callback
exports.getOnId = function (req, res) {
  Callback.findById(req.params.id, function (err, callback) {
    if (err) { return handleError(res, err); }
    if (!callback) { return res.status(404).send('Not Found'); }
    return res.json(callback);
  });
};

//search based on filter
exports.getOnFilter = function (req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  if (req.body.userMobileNos)
    filter['mobile'] = { $in: req.body.userMobileNos };
  var arr = [];
  if (req.body.searchstr) {
    arr[arr.length] = { fname: { $regex: searchStrReg } };
    arr[arr.length] = { lname: { $regex: searchStrReg } };
    arr[arr.length] = { mobile: { $regex: searchStrReg } };
    arr[arr.length] = { phone: { $regex: searchStrReg } };
    arr[arr.length] = { email: { $regex: searchStrReg } };
    arr[arr.length] = { ticketId: { $regex: searchStrReg } };
  }

  if (arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if (req.body.pagination) {
    Utility.paginatedResult(req, res, Callback, filter, {});
    return;
  }

  var sortObj = {};
  if (req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Callback.find(filter).sort(sortObj);
  query.exec(
    function (err, callbacks) {
      if (err) { return handleError(res, err); }
      //console.log(callbacks);
      return res.status(200).json(callbacks);
    }
  );
};

// Creates a new callback in the DB.
exports.create = function (req, res) {
  req.body.createdAt = new Date();
  Callback.create(req.body, function (err, callback) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(callback);
  });
};

/**
 *  Updated By Mohit Khalkho for CSV - Start
 */

exports.exportCallback = function (req, res) {

  var filter = {};
  if (req.body.filter) {
    filter = req.body.filter;
  }
  if (req.body.userMobileNos) {
    filter['mobile'] = { $in: req.body.userMobileNos.split(',') };
  }

  Callback.find(filter).sort({ createdAt: -1 }).lean().exec(function (err, users) {
    if (err) return handleError(res, err);
    try {
      return _prepareResponse(res, users);
    } catch (exp) {
      return handleError(res, exp);
    }
  });

}

function _prepareResponse(res, users) {
  var tempData = [];
  users.forEach(function (user, key, array) {
    delete array[key]._id;
    tempData.push({
      "Sr. No": key + 1,
      "Ticket Id": user.ticketId,
      "Customer Id": user.customerId,
      "Fullname": user.fname + ' ' + user.lname,
      "Mobile No": user.mobile,
      "Phone No": user.phone,
      "Email Address": user.email,
      "Date of Request": user.createdAt
    });
  });

  try {
    Utility.convertToCSV(res, tempData);
  } catch (excp) {
    throw excp;
  }
}
// Updated By Mohit Khalkho for CSV - End

function handleError(res, err) {
  return res.status(500).send(err);
}