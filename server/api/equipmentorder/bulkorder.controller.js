'use strict';

var _ = require('lodash');
var async = require('async');
var NewEquipmentBulkOrder = require("./newequipmentbulkorder.model");
var Utility = require('./../../components/utility.js');
var moment = require("moment");
var xlsx = require('xlsx');

exports.get = function (req, res) {
  var filter = {};
  var queryParam = req.query;

  if (queryParam.searchstr) {
    filter['$text'] = {
      '$search': "\"" + queryParam.searchstr + "\""
    }
  }

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, NewEquipmentBulkOrder, filter, {});
    return;
  }
  var limit = 1000;
  if (queryParam.limit && queryParam.limit < 1000)
    limit = queryParam.limit;
  var query = NewEquipmentBulkOrder.find(filter).limit(limit).sort({ createdAt: -1 });
  query.exec(function (err, result) {
    if (err) return handleError(res, err);
    req.result = result;
    if (queryParam.type == 'excel')
      renderExcel(req, res);
    else
      renderJSON(req, res);
  })
}

exports.save = function (req, res) {
  var bodyData = req.body;
  NewEquipmentBulkOrder.create(bodyData, function (err, result) {
    if (err) return handleError(res, err);
    return res.status(200).json(result);
  });
}

function renderJSON(req, res) {
  return res.status(200).json(req.result);
}

var Customer_Excel_Header = {
  "Ticket Id": "orderId",
  "Request Raised By": "requestRaisedBy",
  "User Name": "name",
  "Mobile": "mobile",
  "Email Address": "email",
  "Country": "country",
  "State": "state",
  "City": "city"
};

var Data_Excel_Header = {
  "Category": "category",
  "Brand": "brand",
  "Model": "model",
  "Quantity": "quantity",
  "Indicative Price": "indicativePrice",
  "Indicative Rate": "indicativeRate",
  "Indicative Down Payment": "indicativeDownpayment",
  "Date of Request": "createdAt"
}

function renderExcel(req, res) {

  var dataArr = [];
  var keys = Object.keys(Customer_Excel_Header);
  var dataKeys = Object.keys(Data_Excel_Header);
  dataArr[dataArr.length] = keys;
  dataArr[0] = dataArr[0].concat(dataKeys);

  req.result.forEach(function (item) {
    var rowData = [];
    keys.forEach(function (key) {
      var val = _.get(item, Customer_Excel_Header[key], "");
      if (Customer_Excel_Header[key] == "requestRaisedBy") {
        if (item.forSelf)
          val = "Self"
        else
          val = item.user.name || "";
      }
      rowData.push(val);
    });
    if (!item.orders || !item.orders)
      return;
    item.orders.forEach(function (order, idx) {
      var row = [].concat(rowData);
      row[0] = row[0] + "." + (idx + 1);
      dataKeys.forEach(function (key) {
        var val = _.get(order, Data_Excel_Header[key], "");
        if (Data_Excel_Header[key] == "createdAt")
          val = moment(item.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
        row.push(val);
      });
      dataArr.push(row);
    });
  });
  _transformResponse(res, dataArr, keys, dataKeys);
}

function _transformResponse(res, dataArr, keys, dataKeys) {
  var accumulatedHeaders = keys.concat(dataKeys);
  var tempData = [];
  dataArr.forEach(function (data) {
    var obj = {};
    accumulatedHeaders.forEach(function (item, index) {
      obj[accumulatedHeaders[accumulatedHeaders.length - (accumulatedHeaders.length - index)]] = data[accumulatedHeaders.length - (accumulatedHeaders.length - index)];
    });
    tempData.push(obj);
  });
  tempData.splice(0, 1);
  try {
    Utility.convertToCSV(res, tempData);
  } catch (e) {
    throw e;
  }
}

function handleError(res, err) {
  return res.status(500).send(err);
}


