'use strict';

var _ = require('lodash');
var ServiceRequest = require('./servicerequest.model');
var Utility = require('./../../components/utility.js');
var  xlsx = require('xlsx');
var moment = require('moment');
//search based on service type
exports.getService = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  var arr = [];
  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in:req.body.userMobileNos};
  if(req.body.type)
    filter['type'] = req.body.type;

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
    arr[arr.length] = { "request.financeInfo.finAgency": { $regex: searchStrReg }};
    arr[arr.length] = { "request.financeInfo.periodInMonths": { $regex: searchStrReg }};
    arr[arr.length] = { "request.message": { $regex: searchStrReg }};
  }

  if(arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,ServiceRequest,filter,{});
    return;    
  }

  var sortObj = {}; 
  
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = ServiceRequest.find(filter);
  //console.log("filetr ",filter);
  query.exec(
               function (err, Negotiation) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(Negotiation);
               }
  );
};

// Creates a new service in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  ServiceRequest.create(req.body, function(err, request) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(request);
  });
};

//data export

var EASY_FINANCE_FIELD_MAP = {
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
                              'Amount to be Financed' : 'request.financeInfo.assetCost',
                              'Indicative Rate' : 'request.financeInfo.indicativeRate',
                              'Tenure(in months)' : 'request.financeInfo.periodInMonths',
                              'Financing Company' : 'request.financeInfo.finAgency',
                              'Comments' : 'request.message',
                              'Date of Request' : 'createdAt'
                            };

var INSPECTION_REQUEST_FIELD_MAP = {
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
                              'Purpose of valuation' : 'request.valuation',
                              'Schedule a call' : 'request.scheduleC',
                              'Date & Time' : 'scheduledDateTime',
                              'Comments' : 'request.comment',
                              'Date of Request' : 'createdAt'
                            };
exports.exportData = function(req,res){

  var filter = {};
  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in:req.body.userMobileNos.split(',')};
  var FIELD_MAP = {};
  if(req.body.type) {
    filter['type'] = req.body.type;
    if(req.body.type =='EASY_FINANCE')
      FIELD_MAP = EASY_FINANCE_FIELD_MAP;
    else
      FIELD_MAP = INSPECTION_REQUEST_FIELD_MAP;
  }

  var query = ServiceRequest.find(filter).sort({createdAt:-1});
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
            else if(FIELD_MAP[header] == 'scheduledDateTime') {
              if(item.request.scheduleDate)
                dataArr[idx + 1].push(moment(_.get(item, 'request.scheduleDate', '')).format('MM/DD/YYYY') + ' ' + _.get(item, 'request.scheduledTime', ''));
              else
                dataArr[idx + 1].push('');
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