'use strict';

var _ = require('lodash');
var Negotiation = require('./negotiation.model');
var Utility = require('./../../components/utility.js');
var  xlsx = require('xlsx');
var Product = require('./../product/product.model');
var extend = require('util')._extend;
// Get list of services


// Creates a new service in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  if(req.body.product._id)
    var productId = req.body.product._id;
  Product.findOne({_id: productId}, function(err, data) {
    if (err) { return handleError(res, err);}
    
    if (!data) 
      return res.status(200).json({errorCode: 1, message: "Not Exist!!!"});
    if(!data.status || data.deleted)
      return res.status(200).json({errorCode:2, message:"Product Not available for now. Please contact iQuippo team."});
    
    req.body.createdAt = new Date();
    Negotiation.create(req.body, function(err, service) {
      if(err) { return handleError(res, err); }
      return res.status(200).json({errorCode:0, message:"Your request has been submitted successfully"});
    });
  });
};

//search based on product _id
exports.search = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  var arr = [];
  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in:req.body.userMobileNos};
  if(req.body.reqType == "buyRequest") {
  	var typeFilter = {};
    typeFilter['$ne'] = "FOR_RENT";
    filter["type"] = typeFilter;
  } else if(req.body.reqType == "rentRequest") {
    filter["type"] = "FOR_RENT";
  }

  if(req.body.searchstr){
    arr[arr.length] = { "user.fname": { $regex: searchStrReg }};
    arr[arr.length] = { "user.lname": { $regex: searchStrReg }};
    arr[arr.length] = { "user.mobile": { $regex: searchStrReg }};
    arr[arr.length] = { "user.phone": { $regex: searchStrReg }};
    arr[arr.length] = { "user.email": { $regex: searchStrReg }};
    arr[arr.length] = { "user.country": { $regex: searchStrReg }};
    arr[arr.length] = { "product.assetId": { $regex: searchStrReg }};
    arr[arr.length] = { "product.productId": { $regex: searchStrReg }};
    arr[arr.length] = { "product.name": { $regex: searchStrReg }};
    arr[arr.length] = { "product.mfgYear": { $regex: searchStrReg }};
    arr[arr.length] = {"ticketId" : {$regex :searchStrReg}};
  }

  if(arr.length > 0)
    filter['$or'] = arr;
  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,Negotiation,filter,{});
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Negotiation.find(filter);
  //console.log("filetr ",filter);
  query.exec(
               function (err, Negotiation) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(Negotiation);
               }
  );
};

//data export

var BUY_REQUEST_FIELD_MAP = {
                              'Ticket Id' : 'ticketId',
                              'Full Name' : 'fullName',
                              'Country' : 'user.country',
                              'Location' : 'user.city',
                              'Phone No.' : 'user.phone',
                              'Mobile No.' : 'user.mobile',
                              'Email Address' : 'user.email',
                              'Buy Now Price' : 'buyNowPrice',
                              'Make an Offer Price' : 'offer',
                              'Asset ID' : 'product.assetId',
                              'Product Name' : 'product.name',
                              'Location of Asset' : 'product.city',
                              'Manufacturing Year' :'product.mfgYear',
                              'Seller Name' : 'sellerFullName',
                              'Seller Contact Number' : 'product.seller.mobile',
                              'Date of Request' : 'createdAt'
                            };

var RENT_REQUEST_FIELD_MAP = {
                              'Ticket Id' : 'ticketId',
                              'Full Name' : 'fullName',
                              'Country' : 'user.country',
                              'Location' : 'user.city',
                              'Phone No.' : 'user.phone',
                              'Mobile No.' : 'user.mobile',
                              'Email Address' : 'user.email',
                              'Asset ID' : 'product.assetId',
                              'Product Name' : 'product.name',
                              'Location of Asset' : 'product.city',
                              'Manufacturing Year' :'product.mfgYear',
                              'Seller Name' : 'sellerFullName',
                              'Seller Contact Number' : 'product.seller.mobile',
                              'Rent Information – Hours' : 'product.rent.rateHours.rentAmountH',
                              'Rent Information – Days' : 'product.rent.rateDays.rentAmountD',
                              'Rent Information – Months' : 'product.rent.rateMonths.rentAmountM',
                              'Security Deposit – Hours' : 'product.rent.rateHours.seqDepositH',
                              'Security Deposit – Days' : 'product.rent.rateDays.seqDepositD',
                              'Security Deposit – Months' : 'product.rent.rateMonths.seqDepositM',
                              'Date of Request' : 'createdAt'
                            };
exports.exportData = function(req,res){
  var filter = {};
  var FIELD_MAP = {};
  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in:req.body.userMobileNos.split(',')};
  if(req.body.reqType == "buyRequest") {
    FIELD_MAP = _.assign({},BUY_REQUEST_FIELD_MAP);
    if(req.body && req.body.role !== "admin"){
      delete FIELD_MAP['Seller Name'];
      delete FIELD_MAP['Seller Contact Number'];
    }
    var typeFilter = {};
    typeFilter['$ne'] = "FOR_RENT";
    filter["type"] = typeFilter;
  } else if(req.body.reqType == "rentRequest") {
    FIELD_MAP = _.assign({},RENT_REQUEST_FIELD_MAP);
    if(req.body && req.body.role!=="admin"){
      delete FIELD_MAP['Seller Name'];
      delete FIELD_MAP['Seller Contact Number'];
    }
    filter["type"] = "FOR_RENT";
  }
  
  var query = Negotiation.find(filter).sort({createdAt:-1});
  query.exec(
     function (err, trends) {
        if(err) { return handleError(res, err); }
        var dataArr = [];
        var headers = Object.keys(FIELD_MAP);
        dataArr.push(headers);
        trends.forEach(function(item,idx){
          dataArr[idx + 1] = [];
          headers.forEach(function(header){
            if(FIELD_MAP[header] == 'fullName')
              dataArr[idx + 1].push(_.get(item, 'user.fname', '') + ' ' + _.get(item, 'user.lname', ''));
            else if(FIELD_MAP[header] == 'sellerFullName')
              dataArr[idx + 1].push(_.get(item, 'product.seller.fname', '') + ' ' + _.get(item, 'product.seller.lname', ''));
            else if(FIELD_MAP[header] == 'buyNowPrice') {
              if(item && item.product && item.product.grossPrice)
                dataArr[idx + 1].push(_.get(item, 'product.grossPrice', ''));
              else
                dataArr[idx + 1].push('');
            } else if(FIELD_MAP[header] == 'createdAt') {
              dataArr[idx + 1].push(Utility.toIST(_.get(item, 'createdAt', '')));
            }
            else
              dataArr[idx + 1].push(_.get(item,FIELD_MAP[header],''));
          });
        });

        var ws = Utility.excel_from_data(dataArr,headers);
        var ws_name = "Report_" + new Date().getTime();
        var wb = Utility.getWorkbook();
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
}

function handleError(res, err) {
  return res.status(500).send(err);
}