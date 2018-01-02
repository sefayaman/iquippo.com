'use strict';

var _ = require('lodash');
var async = require('async');
var NewEquipmentBulkOrder = require("./newequipmentbulkorder.model");
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
    Utility.paginatedResult(req, res, NewEquipmentBulkOrder, filter, {});
    return;
  }
  var limit = 1000;
  if(queryParam.limit && queryParam.limit < 1000)
    limit = queryParam.limit;
  var query = NewEquipmentBulkOrder.find(filter).limit(limit).sort({createdAt:-1});
  query.exec(function(err,result){
    if(err) return handleError(res,err);
     req.result = result;
    if(queryParam.type == 'excel')
      renderExcel(req,res);
    else
      renderJSON(req,res);
  })
}

exports.save = function(req,res){
  var bodyData = req.body;
  NewEquipmentBulkOrder.create(bodyData,function(err,result){
    if(err) return handleError(res,err);
      return res.status(200).json(result);
  });
}

function renderJSON(req,res){
    return res.status(200).json(req.result);
}

  var Customer_Excel_Header = {
    "Ticket Id": "orderId",
    "Request Raised By" : "requestRaisedBy",
    "User Name": "name",
    "Mobile": "mobile",
    "Email Address": "email",
    "Country" : "country",
    "State": "state",
    "City" : "city"
  };

  var Data_Excel_Header = {
    "Category" : "category",
    "Brand" : "brand",
    "Model" : "model",
    "Quantity" : "quantity",
    "Indicative Price":"indicativePrice",
    "Indicative Rate":"indicativeRate",
    "Indicative Down Payment":"indicativeDownpayment",
    "Date of Request" : "createdAt"
  }

  function renderExcel(req,res){
    
    var dataArr = [];
    var keys = Object.keys(Customer_Excel_Header);
    var dataKeys = Object.keys(Data_Excel_Header);
    dataArr[dataArr.length] = keys;
    dataArr[0] = dataArr[0].concat(dataKeys);

    req.result.forEach(function(item){
      var rowData = [];
      keys.forEach(function(key){
        var val = _.get(item,Customer_Excel_Header[key],"");
        if(Customer_Excel_Header[key] == "requestRaisedBy"){
            if(item.forSelf)
              val = "Self"
            else
              val = item.user.name || "";
          }
        rowData.push(val);
      });
      if(!item.orders ||  !item.orders)
        return;
      item.orders.forEach(function(order,idx){
        var row = [].concat(rowData);
        row[0] = row[0] + "." + (idx + 1);
        dataKeys.forEach(function(key){
          var val = _.get(order,Data_Excel_Header[key],"");
          if(Data_Excel_Header[key] == "createdAt")
            val = moment(item.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
          row.push(val);
        });
        dataArr.push(row);
      });
    }); 
    var ws = Utility.excel_from_data(dataArr,dataArr[0]);
    var ws_name = "new_equipment_order_" + new Date().getTime();
    var wb = Utility.getWorkbook();
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;
    var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
    res.end(wbout);
  }


function handleError(res, err) {
  return res.status(500).send(err);
}


