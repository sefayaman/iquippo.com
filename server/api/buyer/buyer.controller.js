'use strict';

var _ = require('lodash');
var Buyer = require('./buyer.model');
var Seq = require('seq');
var PaymentTransaction = require('./../payment/payment.model');
var Utility = require('./../../components/utility.js');
var xlsx = require('xlsx');
// Get list of buyer
exports.getAll = function (req, res) {
  Buyer.find(function (err, buyer) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(buyer);
  });
};

// Get a single buyer
exports.getOnId = function (req, res) {
  Buyer.findById(req.params.id, function (err, buyer) {
    if (err) { return handleError(res, err); }
    if (!buyer) { return res.status(404).send('Not Found'); }
    return res.json(buyer);
  });
};

// Creates a new buyer in the DB.
exports.create = function (req, res) {
  //console.log("buyer created");
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Buyer.create(req.body, function (err, buyer) {
    return res.status(201).json(buyer);
  });
};

//search based on product _id
exports.search = function (req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  var arr = [];
  if (req.body.searchstr) {
    arr[arr.length] = { fname: { $regex: searchStrReg } };
    arr[arr.length] = { lname: { $regex: searchStrReg } };
    arr[arr.length] = { mobile: { $regex: searchStrReg } };
    arr[arr.length] = { phone: { $regex: searchStrReg } };
    arr[arr.length] = { email: { $regex: searchStrReg } };
    arr[arr.length] = { country: { $regex: searchStrReg } };
    arr[arr.length] = { contact: { $regex: searchStrReg } };
    arr[arr.length] = { "financeInfo.finAgency": { $regex: searchStrReg } };
    arr[arr.length] = { "financeInfo.periodInMonths": { $regex: searchStrReg } };
    arr[arr.length] = { "financeInfo.assetCost": { $regex: searchStrReg } };
    arr[arr.length] = { "financeInfo.financeAmount": { $regex: searchStrReg } };
    arr[arr.length] = { "product.assetId": { $regex: searchStrReg } };
    arr[arr.length] = { "product.productId": { $regex: searchStrReg } };
    arr[arr.length] = { "product.name": { $regex: searchStrReg } };
    arr[arr.length] = { "product.tradeType": { $regex: searchStrReg } };
    arr[arr.length] = { message: { $regex: searchStrReg } };
  }

  if (arr.length > 0)
    filter['$or'] = arr;
  if (req.body.userMobileNos)
    filter['mobile'] = { $in: req.body.userMobileNos };
  if (req.body._id)
    filter["product._id"] = req.body._id;

  var result = {};
  if (req.body.pagination) {
    Utility.paginatedResult(req, res, Buyer, filter, {});
    return;
  }

  var sortObj = {};
  if (req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Buyer.find(filter);
  //console.log("filetr ",filter);
  query.exec(
    function (err, Buyer) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(Buyer);
    }
  );
};
// Updates an existing buyer in the DB.
exports.update = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Buyer.findById(req.params.id, function (err, buyer) {
    if (err) { return handleError(res, err); }
    if (!buyer) { return res.status(404).send('Not Found'); }
    var updated = _.merge(buyer, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(buyer);
    });
  });
};

// Deletes a buyer from the DB.
exports.destroy = function (req, res) {
  Buyer.findById(req.params.id, function (err, buyer) {
    if (err) { return handleError(res, err); }
    if (!buyer) { return res.status(404).send('Not Found'); }
    buyer.remove(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.buyNow = function (req, res) {

  Seq()
    .seq(function () {
      var self = this;
      PaymentTransaction.create(req.body.payment, function (err, paytm) {
        if (err) { return handleError(err, res) }
        else {
          req.payTransId = paytm._id;
          self();
        }
      })
    })
    .seq(function () {
      var self = this;
      req.body.buyReq.transactionId = req.payTransId + "";
      Buyer.create(req.body.buyReq, function (err, buyReq) {
        if (err) { return handleError(err, res) }
        else {
          res.status(200).json({ transactionId: req.payTransId });
        }
      })
    });
}

exports.getOnFilter = function (req, res) {
  var filter = {};
  if (req.body.transactionId)
    filter['transactionId'] = req.body.transactionId;
  Buyer.find(filter, function (err, buyReqs) {
    if (err) { return handleError(res, err) }
    res.status(200).json(buyReqs);
  });
}

exports.exportBuyer = function (req, res) {
  var filter = {};

  if (req.body.userMobileNos) {
    filter['mobile'] = { $in: req.body.userMobileNos.split(',') };
  }

  var dateFilter = {};
 
    if(req.body.fromDate)
    dateFilter['$gte'] = new Date(req.body.fromDate);
    if(req.body.toDate) {
        var toDate = new Date(req.body.toDate);
        var nextDay = toDate.getDate() + 1;
        toDate.setDate(nextDay);
        dateFilter.$lt = toDate;
    }
    if(req.body.fromDate || req.body.toDate)
      filter['createdAt'] = dateFilter;
      
  Buyer.find(filter).sort({ createdAt: -1 }).lean().exec(
    function (err, users) {
      if (err) { return handleError(res, err); }
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
      "Fullname": user.fname + ' ' + user.mname + ' ' + user.lname,
      "Country": user.country,
      "Phone No": user.phone,
      "Mobile No": user.mobile,
      "Email Address": user.email,
      "Method of Contact": user.contact,
      "Amount to be Financed": user.financeInfo,
      "Date of Request":  Utility.toDanishDate(user.createdAt)
    });
  });

  try {
    Utility.convertToCSV(res, tempData);
  } catch (excp) {
    throw excp;
  }
}

//export data into excel
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
    cell.t = 'n'; cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  }
  else cell.t = 's';
}

function excel_from_data(data) {
  var ws = {};
  var range;
  range = { s: { c: 0, r: 0 }, e: { c: 14, r: data.length } };

  for (var R = 0; R != data.length + 1; ++R) {

    var C = 0;
    var user = null;
    var cell = null;
    if (R != 0)
      user = data[R - 1];

    if (R == 0)
      cell = { v: "Sr. No" };
    else {
      if (user)
        cell = { v: R };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Ticket Id" };
    else {
      if (user)
        cell = { v: (user.ticketId || "") };
    }

    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Full Name" };
    else {
      if (user)
        cell = { v: (user.fname || "") + " " + (user.lname || "") };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Country" };
    else {
      if (user)
        cell = { v: user.country || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Phone No." };
    else {
      if (user)
        cell = { v: user.phone || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Mobile No." };
    else {
      if (user)
        cell = { v: user.mobile || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Email Address" };
    else {
      if (user)
        cell = { v: user.email || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Method of contact" };
    else {
      if (user)
        cell = { v: user.contact || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Amount to be Financed" };
    else {
      if (user && user.financeInfo)
        cell = { v: user.financeInfo.financeAmount || "" };
      else
        cell = { v: "" };

    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Indicative Rate" };
    else {
      if (user && user.financeInfo)
        cell = { v: user.financeInfo.assetCost || "" };
      else
        cell = { v: "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Tenure" };
    else {
      if (user && user.financeInfo)
        cell = { v: user.financeInfo.periodInMonths || "" };
      else
        cell = { v: "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Financing Company" };
    else {
      if (user && user.financeInfo)
        cell = { v: user.financeInfo.finAgency || "" };
      else
        cell = { v: "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Comments" };
    else {
      if (user)
        cell = { v: user.message || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Date of Request" };
    else {
      if (user)
        cell = { v: Utility.toIST(_.get(user, 'createdAt', '')) };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;

    if (R == 0)
      cell = { v: "Requested Products" };
    else {
      if (user)
        cell = { v: getRequestedProducts(user.product) || "" };
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({ c: C++, r: R })
    ws[cell_ref] = cell;
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

function getRequestedProducts(productsData) {
  if (!productsData)
    return "";
  var productArr = [];
  if (productsData.length > 0) {
    productsData.forEach(function (product) {
      var tradeType = "";
      if (product.tradeType)
        var tradeType = product.tradeType;
      productArr[productArr.length] = product.productId + " | " + product.name + " | " + tradeType;
    });
  }
  return productArr.join("; ");
}

function handleError(res, err) {
  return res.status(500).send(err);
}
