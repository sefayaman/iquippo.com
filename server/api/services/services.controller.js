'use strict';

var _ = require('lodash');
var ServiceEnquiry = require('./services.model');
var email = require('./../../components/sendEmail.js');
var  xlsx = require('xlsx');
var Seq = require('seq');
var PaymentTransaction = require('./../payment/payment.model');

// Get list of services
exports.getAll = function(req, res) {
  ServiceEnquiry.find(function (err, service) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(service);
  });
};

// Get a single services
exports.getOnId = function(req, res) {
  ServiceEnquiry.findById(req.params.id, function (err, service) {
    if(err) { return handleError(res, err); }
    if(!service) { return res.status(404).send('Not Found'); }
    return res.json(service);
  });
};

//search based on service type
exports.getService = function(req, res) {
  var filter = {};
  if(req.body.type){
    var typeFilter = {};
    var typeArr = [];
    if(req.body.type.shipping)
      typeArr.push(req.body.type.shipping);
    if(req.body.type.valuation)
      typeArr.push(req.body.type.valuation);
    if(req.body.type.cetifiedByiQuippo)
      typeArr.push(req.body.type.cetifiedByiQuippo);
    typeFilter['$in'] = typeArr;
    filter["type"] = typeFilter;
  }

  var query = ServiceEnquiry.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, addServices) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(addServices);
               }
  );
};

// Creates a new service in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  // var prQuote = validateProductQuote(req.body);  
  if(req.body.valuation.type==="valuation"){
    console.log("get me valuationQuote",req.body.valuation);
  Seq()
    .seq(function(){
      var self = this;
      if(!req.body.payment){
        self()
        return;
      }
      req.body.payment.createdAt = new Date();
      req.body.payment.updatedAt = new Date();
       PaymentTransaction.create(req.body.payment, function(err, payment) {
          if(err){return handleError(err,res)}
            else{
              req.transactionId = payment._id;
              self();
            }
          });
      })
      .seq(function(){
        var self = this;
        req.body.createdAt = new Date();
        req.body.valuation.transactionId = req.transactionId;
        ServiceEnquiry.create(req.body.valuation, function(err, valuation) {
          if(err){return handleError(err,res)}
            else{
              var resObj = {}
              resObj.transactionId = valuation.transactionId;
              resObj.errorCode = 0;
              return res.status(200).json(resObj);
            }
          });
      }) 
}
else{
  req.body.createdAt = new Date();
  ServiceEnquiry.create(req.body, function(err, service) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(service);
  });
}
};

//export data into excel
function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function datenum(v, date1904) {
  if(date1904) v+=1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
 
function setType(cell){
  if(typeof cell.v === 'number')
    cell.t = 'n';
  else if(typeof cell.v === 'boolean')
      cell.t = 'b';
  else if(cell.v instanceof Date)
   {
        cell.t = 'n'; cell.z = xlsx.SSF._table[14];
        cell.v = datenum(cell.v);
    }
    else cell.t = 's';
}

function excel_from_data(data) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:7, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    
    var C = 0;
    var service = null;
    var cell = null;

    if(R != 0)
      service = data[R-1];

    if(R == 0)
      cell = {v: "Service Type"};
    else {
      if(service)
        cell = {v: service.type};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Name"};
    else{
      if(service)
        cell =  {v: service.quote.fname + " " + service.quote.mname + " " + service.quote.lname};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Country"};
    else {
      if(service)
        cell = {v: service.quote.country};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Company Name"};
    else {
      if(service)
        cell = {v: service.quote.companyname};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Email"};
    else {
      if(service)
        cell = {v: service.quote.email};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Mobile No."};
    else {
      if(service)
        cell = {v: service.quote.mobile};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

exports.exportServices = function(req,res){
  var filter = {};
  if(req.body.filter)
    filter = req.body.filter;
  var query = ServiceEnquiry.find(filter).sort({fname:1});
  query.exec(
     function (err, service) {
        if(err) { return handleError(res, err); }
        var ws_name = "service"
        var wb = new Workbook();
        var ws = excel_from_data(service);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
}

function handleError(res, err) {
  return res.status(500).send(err);
}