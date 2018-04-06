'use strict';

var _ = require('lodash');
var crypto = require('crypto');
var Payment = require('./payment.model');
var ValuationReq = require('./../valuation/valuation.model');
var  xlsx = require('xlsx');
var config = require('./../../config/environment');
var async = require('async');
var Util = require('./../../components/utility.js');
var moment = require('moment');
var Utility = require('./../../components/utility.js');

var trasactionStatuses = ['failed', 'pending', 'completed'];
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];

// Get list of payment transaction
exports.getAll = function (req, res) {

  Payment.find({ status: { $eq: 'listed' } }, function (err, payments) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(payments);
  });

};

// Get a single Payment
exports.getOnId = function (req, res) {
  Payment.findById(req.params.id, function (err, payment) {
    if (err) { return handleError(res, err); }
    if (!payment) { return res.status(404).send('Not Found'); }
    return res.json(payment);
  });
};

// Creates a new payment in the DB.
exports.create = function (req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Payement.create(req.body, function (err, payment) {
    return res.status(201).json(payment);
  });
};

function paymentUpdate(options, cb) {
  var filter = {};
  filter._id = options.transactionId;
  Payment.update(filter, { $set: { 'status': options.status } }, function (err, update) {
    if (err) cb(err);
    return cb(null);
  });
}

//search based on filter
exports.getOnFilter = function (req, res) {
  var filter = {};
  if (req.body.searchStr) {
    filter['$text'] = {
      '$search': "\"" + req.body.searchStr + "\""
    }
  }
  if (req.body._id)
    filter._id = req.body._id;

  if (req.body.auction_id)
    filter.auction_id = req.body.auction_id;

  if (req.body.auctionId)
    filter.auctionId = req.body.auctionId;

  if (req.body.userId)
    filter["user._id"] = req.body.userId;

  if (req.body.auctionPaymentReq)
    filter.requestType = req.body.auctionPaymentReq;

  if (req.body.auction) {
    var typeFilter = {};
    typeFilter.$ne = req.body.auction;
    filter.requestType = typeFilter;
  }

  if (req.body.pagination) {
    Util.paginatedResult(req, res, Payment, filter, {});
    return;
  }

  var query = Payment.find(filter).sort({ createdAt: -1 });
  query.exec(
               function (err, payments) {
                      if(err) { return handleError(res, err); }
                      if(payments[0] && payments[0].requestType && payments[0].requestType === 'Valuation Request')
                        addValuationData(req, res, payments);
                      else
                        return res.status(200).json(payments);
               }
  );
};

  function addValuationData(req,res,payments) {
    ValuationReq.find({
        "transactionId": req.body._id,
      }, function(err, valResult) {
        if(err) { return handleError(res, err); }
        var tempPaymentArr = [];
        payments.forEach(function(item){
          item = item.toObject();
          item.valuationData = {};
          item.valuationData = valResult[0];
          tempPaymentArr.push(item);
        });
        return res.status(200).json(tempPaymentArr);
      });
  }

// Updates an existing payment in the DB.
exports.update = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Payment.findById(req.params.id, function (err, payment) {
    if (err) { return handleError(res, err); }
    if (!payment) { return res.status(404).send('Not Found'); }
    Payment.update({ _id: req.params.id }, { $set: req.body }, function (err) {
      if (err) { return handleError(res, err); }
      if (req.body && req.body.userDataSendToAuction) {
        req.body._id = req.params.id;
        postRequest(req, res);
      } else
        return res.status(201).json({ errorCode: 0, message: "Payment request submitted successfully !!!" });
    });
  });
};

exports.sendReqToCreateUser = function (req, res) {
  postRequest(req, res);
};

function postRequest(req, res) {
  var options = {};
  Payment.find({
    "transactionId": req.body.transactionId,
  }, function (err, paymentResult) {
    options.dataToSend = {};
    options.dataToSend.user = {};
    options.dataToSend.user.user_id = paymentResult[0].user._id;
    options.dataToSend.user.iq_id = paymentResult[0].user.customerId;
    if (paymentResult[0].user.batonNo)
      options.dataToSend.user.iq_id = paymentResult[0].user.batonNo;
    options.dataToSend.user.fname = paymentResult[0].user.fname;
    options.dataToSend.user.lname = paymentResult[0].user.lname;
    options.dataToSend.user.email = paymentResult[0].user.email;
    options.dataToSend.user.mobile = paymentResult[0].user.mobile;
    options.dataToSend.amountPaid = paymentResult[0].totalAmount;
    options.dataToSend.auction_id = paymentResult[0].auction_id + "";
    options.dataToSend.selectedLots = paymentResult[0].selectedLots;
    options.dataType = "userInfo";
    console.log('paymentauctiontype',paymentResult[0].auctionType);
    if ( paymentResult[0].auctionType==='PT' ) {
        options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
        update(options.dataToSend);
        return res.status(201).json({ errorCode: 0, message: "Payment request submitted successfully !!!" });
    }
    else {
        Util.sendCompiledData(options, function (err, result) {
          options.dataToSend._id = paymentResult[0]._id;
          if (err || (result && result.err)) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
            update(options.dataToSend);
            if (result && result.err)
              return res.status(412).send(result.err);
            return res.status(412).send("Payment details saved successfully. Details not passed to AS portal. Use Retry button");
          }
          if (result) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
            update(options.dataToSend);
            return res.status(201).json({ errorCode: 0, message: "Payment request submitted successfully !!!" });
          }
        });
    }
  });
}

function update(userReq) {
  var id = userReq._id;
  delete userReq._id;
  Payment.update({ _id: id }, { $set: { "reqSubmitStatus": userReq.reqSubmitStatus } }, function (err, retVal) {
    if (err) {
      console.log("Error with updating Payment request");
    }
    console.log("Payment Updated");
  });
}
// Deletes a payment from the DB.
exports.destroy = function (req, res) {

  Payment.findById(req.params.id, function (err, payment) {
    if (err) { return handleError(res, err); }
    if (!payment) { return res.status(404).send('Not Found'); }
    Payment.remove(function (err) {
      if (err) { return handleError(res, err); }
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
    cell.t = 'n'; cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  }
  else cell.t = 's';
}

function setCell(ws, cell, R, C) {
  setType(cell);
  var cell_ref = xlsx.utils.encode_cell({ c: C, r: R })
  ws[cell_ref] = cell;
}

function excel_from_data(data, isAdmin) {
  var ws = {};
  var range;
  range = { s: { c: 0, r: 0 }, e: { c: 9, r: data.length } };

  for (var R = 0; R != data.length + 1; ++R) {
    var C = 0;
    var payment = null;
    if (R != 0)
      payment = data[R - 1];
    var cell = null;
    if (R == 0)
      cell = { v: "Transaction Id" };
    else {
      if (payment)
        cell = { v: payment.requestId };
    }

    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Category" };
    else {
      if (payment)
        cell = { v: payment.product.category };
    }
    setCell(ws, cell, R, C++);


    if (R == 0)
      cell = { v: "Asset Id" };
    else {
      if (payment)
        cell = { v: payment.product.assetId };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Asset Name" };
    else {
      if (payment)
        cell = { v: payment.product.name };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Asset Status" };
    else {
      if (payment)
        cell = { v: payment.product.status };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Asset Location" };
    else {
      if (payment)
        cell = { v: payment.product.city };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Request Type" };
    else {
      if (payment)
        cell = { v: payment.requestType };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Request Date" };
    else {
      if (payment)
        cell = { v: payment.createdAt };
    }
    setCell(ws, cell, R, C++);

    if (R == 0)
      cell = { v: "Request Status" };
    else {
      if (payment)
        cell = { v: payment.status };
    }
    setCell(ws, cell, R, C++);

  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

exports.exportPayment = function (req, res) {
  var filter = {};
  var isAdmin = true;
  if (req.body.auctionPaymentHistory) {
    //auctionReport(req, res);
    auctionReportAll(req, res);
    return;
  }
  if (req.body.userid) {
    filter["user._id"] = req.body.userid;
    isAdmin = false;
  }
  if (req.body.ids)
    filter['_id'] = { $in: req.body.ids };
  var query = Payment.find(filter).sort({ transactionId: 1 });
  query.lean().exec(
    function (err, payments) {
      if (err) { return handleError(res, err); }
      try {
        return _prepareCSVResponse(res, payments);
      } catch (exp) {
        return handleError(res, exp);
      }
    });
};

function _prepareCSVResponse(res, payments) {
  var tempData = [];
  payments.forEach(function (payment, key, array) {
    tempData.push({
      "Sr. No": key + 1,
      "Transaction Id": payment.transactionId,
      "Category": payment.product ? payment.product.category : "",
      "Asset Id": payment.product ? payment.product['assetId'] : "",
      "Asset Name": payment.product ? payment.product['name'] : "",
      "Asset Status": payment.product ? payment.product['status'] : "",
      "Asset Location": payment.product ? payment.product['city'] : "",
      "Request Type": payment.requestType,
      "Request Date": payment.createdAt,
      "Request Status": payment.status
    });
  });

  try {
    Utility.convertToCSV(res, tempData);
  } catch (excp) {
    throw excp;
  }
}

var EXPORT_PAYMENT = {
  'Transaction Id': 'transactionId',
  'Auction Id': 'auctionId',
  'Lots': 'lots',
  'Customer Id': 'customerId',
  'Full Name': 'fullName',
  'Mobile No.': 'mobile',
  'Email Address': 'email',
  'Payment Type': 'paymentMode',
  'Payment Mode Type': 'paymentModeType',
  'Bank Name': 'bankName',
  'Branch': 'branch',
  'Ref No': 'refNo',
  'Amount': 'amount',
  'Request Status': 'paymentStatus',
  'Payment Date': 'paymentDate',
  'Date of Entry': 'createdAt'
};

var Export_Field_Mapping = {
  "Transaction Id": "transactionId",
  "Auction Id": "auctionId",
  "Lots": "lots",
  "Customer Id": "customerId",
  "Full Name": "fullName",
  "Mobile No": "mobile",
  "Email Address": "email",
  "Payment Type": "paymentMode",
  "Request Status": "status",
  "Date of Entry": "createdAt"
};
var Export_Field_Mapping_InnerData = {
  "Payment Mode Type": "paymentModeType",
  "Bank Name": "bankname",
  "Branch": "branch",
  "Ref No": "refNo",
  "Amount": "amount",
  "Payment Date": "paymentDate"
};

function _formatPayments(item, innerItem, jsonArr) {
  var obj = {};
  obj['transactionId'] = item.transactionId || "";
  obj['auctionId'] = item.auctionId || "";
  obj['lots'] = item.selectedLots.join() || "";
  obj['customerId'] = item.user.customerId || "";
  obj['fullName'] = item.user.fname + " " + item.user.lname || "";
  obj['mobile'] = item.user.mobile || "";
  obj['email'] = item.user.email || "";
  obj['paymentMode'] = item.paymentMode || "";
  if (innerItem) {
    obj['paymentModeType'] = innerItem.paymentModeType || "";
    obj['bankName'] = innerItem.bankname || "";
    obj['branch'] = innerItem.branch || "";
    obj['refNo'] = innerItem.refNo || "";
    obj['amount'] = innerItem.amount || 0;
    obj['paymentStatus'] = innerItem.paymentStatus === 'failed' ? 'Failed' : 'Completed';
    obj['paymentDate'] = moment(new Date(innerItem.paymentDate)).utcOffset('+0530').format('MM/DD/YYYY') || "";
    obj['createdAt'] = innerItem.createdAt || ""
  }


  jsonArr.push(obj);
}

function auctionReport(req, res) {
  var filter = {};
  if (req.body.auctionPaymentReq)
    filter.requestType = req.body.auctionPaymentReq;
  if (req.body.userId)
    filter["user._id"] = req.body.userId;

  var query = Payment.find(filter).sort({ createdAt: -1 });
  query.exec(
    function (err, resList) {
      if (err) return handleError(res, err);
      var jsonArr = [];
      resList.forEach(function (item, index) {
        if (item.payments) {
          item.payments.forEach(function (innerItem) {
            _formatPayments(item, innerItem, jsonArr);
          });
        }
      });
      resList = [];
      if (jsonArr.length > 0)
        resList = jsonArr.slice();
      var dataArr = [];
      var headers = Object.keys(EXPORT_PAYMENT);
      dataArr.push(headers);
      resList.forEach(function (item, idx) {
        dataArr[idx + 1] = [];
        headers.forEach(function (header) {
          if (EXPORT_PAYMENT[header] == 'createdAt')
            dataArr[idx + 1].push(Util.toIST(_.get(item, 'createdAt', '')));
          else
            dataArr[idx + 1].push(_.get(item, EXPORT_PAYMENT[header], ''));
        });
      });

      var ws = Util.excel_from_data(dataArr, headers);
      var ws_name = "Auction_Payment_Report_" + new Date().getTime();
      var wb = Util.getWorkbook();
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;
      var wbout = xlsx.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
      res.end(wbout);
    });
}
function auctionReportAll(req, res) {
  var filter = {};
  if (req.body.auctionPaymentReq)
    filter.requestType = req.body.auctionPaymentReq;
  if (req.body.userId)
    filter["user._id"] = req.body.userId;

  var query = Payment.find(filter).sort({ createdAt: -1 });
  query.exec(
    function (err, resList) {
      if (err) {
        return handleError(res, err);
      }
      var csvStr = "";
      var headers = Object.keys(Export_Field_Mapping);
      var dataKeys = Object.keys(Export_Field_Mapping_InnerData);
      csvStr += headers.join(',');
      csvStr += "," + dataKeys.join(',');
      csvStr += "\r\n";
      resList.forEach(function (item, idx) {
        var successObj = null;
        if (item.status === 'completed')
          successObj = getSuccessPayment(item.payments, "success");
        else if (item.payments.length)
          successObj = item.payments[0];
        else
          successObj = {};
        headers.forEach(function (header) {
          var key = Export_Field_Mapping[header];
          var val = "";
          //console.log(item.payments.paymentStatus);
          if (key === 'lots') {
            val = _.get(item, "selectedLots", "");
          } else if (key === 'customerId') {
            val = _.get(item.user, "customerId", "");
          } else if (key === 'fullName') {
            val = _.get(item.user, "fname", "") + " " + _.get(item.user, "lname", "");
          } else if (key === 'mobile') {
            val = _.get(item.user, "mobile", "");
          } else if (key === 'email') {
            val = _.get(item.user, "email", "");
          } else if (key === 'paymentMode') {
            val = _.get(item, "paymentMode", "");
          } else if (key === 'createdAt') {
            val = Util.toIST(_.get(item, 'createdAt', ''));
          } else {
            val = _.get(item, key, "");
          }
          val = Util.toCsvValue(val);
          csvStr += val + ",";
        });
        dataKeys.forEach(function (innerKey) {
          var val = "";
          if (successObj)
            val = _.get(successObj, Export_Field_Mapping_InnerData[innerKey], "");
          if (Export_Field_Mapping_InnerData[innerKey] === 'paymentDate' && val)
            val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
          val = Util.toCsvValue(val);
          csvStr += val + ",";
        });
        csvStr += "\r\n";
      });
      var csvName = "PaymentAll_";

      csvStr = csvStr.substring(0, csvStr.length - 1);
      try {
        return renderCsv(req, res, csvStr, csvName);
      } catch (e) {
        //return handleError(res, e);   
      }
    });
}

function getSuccessPayment(payments, status) {
  var retVal = null;
  if (!payments || !payments.length)
    return retVal;
  for (var i = 0; i < payments.length; i++) {
    if ((payments[i].paymentStatus && payments[i].paymentStatus === status) || !payments[i].paymentStatus) {
      retVal = payments[i];
    }
  }
  return retVal;
}


function renderCsv(req, res, csv, csvName) {
  var fileName = csvName + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary');
}

//ccavenue payment keys
//var ccAvenueWorkingKey = "BCCD36E2D20659D5F76B99973880340D"; // localhost account test
//var ccAvenueWorkingKey = "780039A27217D66E066A031F52D772D7"; // localhost live account account
//var ccAvenueWorkingKey = "4B309EB35A3F3C9F903427AB11E062EE"; // iquippo.com live account account

exports.encrypt = function (req, res) {
  var m = crypto.createHash('md5');
  m.update(config.ccAvenueWorkingKey);
  var key = m.digest();
  var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  var encoded = cipher.update(req.body.rawstr, 'utf8', 'hex');
  encoded += cipher.final('hex');
  return res.status(200).json(encoded);
}

exports.paymentResponse = function (req, res) {
  var json = {};
  if (req.body != undefined && Object.keys(req.body).length > 0) {
    json = req.body;
  }
  else if (req.params != undefined && Object.keys(req.params).length > 0) {
    json = req.params;
  }
  else if (req.query != undefined && Object.keys(req.query).length > 0) {
    json = request.query;
  }

  var m = crypto.createHash('md5');
  m.update(config.ccAvenueWorkingKey)
  var key = m.digest();
  var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
  var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  var decoded = decipher.update(json.encResp, 'hex', 'utf8');
  decoded += decipher.final('utf8');

  var arrayVAl = decoded.split("&");
  var resPayment = {};

  arrayVAl.forEach(function (d) {
    var val = d.split("=");
    resPayment[val[0]] = val[1];
  });

  var status = resPayment.order_status.toString().toLowerCase().trim();
  Payment.findById(resPayment.order_id, function (err, payment) {
    if (err) { return handleError(res, err); }
    if (!payment) { return res.status(404).send('Not Found'); }

    var paymentVal = {};
    paymentVal.paymentType = "CCAvenue";
    paymentVal.bank_ref_no = resPayment.bank_ref_no;
    paymentVal.order_status = resPayment.order_status;
    paymentVal.failure_message = resPayment.failure_message;
    paymentVal.payment_mode = resPayment.payment_mode;
    paymentVal.card_name = resPayment.card_name;
    paymentVal.status_message = resPayment.status_message;
    paymentVal.tracking_id = resPayment.tracking_id;
    payment.ccAvenueRes = paymentVal;
    payment.ccAvenueData = resPayment;
    
    if (!payment.ccAvenueHistory || !payment.ccAvenueHistory.length)
      payment.ccAvenueHistory = [];
    payment.ccAvenueHistory.push(resPayment);
    if (status == "success")
      payment.statusCode = 0;
    else
      payment.statusCode = -1;
    payment.save(function (err, pys) {
      if (err) { return handleError(res, err); }
      else {
        sendPaymentRes(req, res, resPayment);
      }

    });
  });

}

function sendPaymentRes(req, res, resPayment) {
  var status = resPayment.order_status.toString().toLowerCase().trim();
  if (resPayment.merchant_param3 == "mobapp") {
    if (status != 'success')
      res.redirect('http://mobile?payment=failed');
    else
      res.redirect('http://mobile?payment=success');
  } else if (resPayment.merchant_param4 === "auction_request")
    res.redirect(config.serverPath + "/auctionpaymentresponse/" + resPayment.order_id);
  else
    res.redirect(config.serverPath + "/paymentresponse/" + resPayment.order_id);
}

function handleError(res, err) {
  return res.status(500).send(err);
}
