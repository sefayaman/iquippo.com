'use strict';

var _ = require('lodash');
var async = require('async');
var BookADemo = require("./bookademo.model");
var Utility = require('./../../components/utility.js');
var moment = require("moment");
var xlsx = require('xlsx');


exports.get = function(req,res){
  var filter = {};
  var queryParam = req.query;
  if (queryParam.searchstr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchstr+"\""
      }
  }
  if(queryParam.pagination){
    Utility.paginatedResult(req, res, BookADemo, filter, {});
    return;
  }
  var limit = 1000;
  if(queryParam.limit && queryParam.limit < 1000)
    limit = parseInt(queryParam.limit);
  var query = BookADemo.find(filter).limit(limit).sort({createdAt:-1});
  query.exec(function(err,result){
    if(err) return handleError(res,err);
    req.result = result;
    if(queryParam.type && queryParam.type == "excel")
      renderExcel(req,res);
    else
      renderJSON(req,res);
  })
}

exports.create = function(req,res){
  var bodyData = req.body;
  BookADemo.create(bodyData,function(err,result){
    if(err) return handleError(res,err);
      return res.status(200).send("Request submitted successfully.");
  });
}

 function renderJSON(req,res){
    return res.status(200).json(req.result);
  }

  var Excel_Header = {
    "Ticket Id" : "ticketId",
    "Customer Name" : "customerName",
    "Customer Mobile" : "mobile",
    "Customer Email" : "email",
    "Category": "category",
    "Brand": "brand",
    "Model": "model",
    "City" : "city",
    "State": "state",
    "Country" : "country",
    "Created At" : "createdAt"
  };

  function renderExcel(req,res){
    var dataArr = [];
    var keys = Object.keys(Excel_Header);
    dataArr[dataArr.length] = keys;
    req.result.forEach(function(item){
      var rowData = [];
      keys.forEach(function(key){
        var val = _.get(item,Excel_Header[key],"");
        if(Excel_Header[key] == 'customerName')
          val = item.fname + " " + item.lname;
        if(Excel_Header[key] == "createdAt")
          val = moment(item.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
        rowData.push(val);
      });
      if(rowData.length)
        dataArr.push(rowData)
    }); 
    var ws = Utility.excel_from_data(dataArr,keys);
    var ws_name = "bookademolist_" + new Date().getTime();
    var wb = Utility.getWorkbook();
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;
    var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
    res.end(wbout);
  }




function handleError(res, err) {
  return res.status(500).send(err);
}


