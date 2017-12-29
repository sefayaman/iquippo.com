'use strict';

var _ = require('lodash');
var Offer = require('./offer.model');
var OfferRequest = require('./newofferrequest.model');
var ApiError = require('../../components/_error');
var Utility = require('./../../components/utility.js');
var moment = require("moment");
var xlsx = require('xlsx');

var Offer_Master_Excel_Header = {
    "Category": "category.name",
    "Brand": "brand.name",
    "Model": "model.name",
    "Country":"country",
    "State": "locations",
    "Cash Offer" : "cash_purchase",
    "Finance Offer" : "finance",
    "Lease Offer" : "lease",
    "Created At" : "createdAt"
};

 var Excel_Header = {
    "User Id" : "user.customerId",
    "Request Raised By" : "requestRaisedBy",
    "Customer Name" : "customerName",
    "Customer Mobile" : "mobile",
    "Email Id" : "email",
    "Ticket Id/Enquiry Id": "orderId",
    "Category": "category.name",
    "Brand": "brand.name",
    "Model": "model.name",
    "State": "state"
  };

  var Data_Excel_Header = {
    "Offer Type" : "type",
    "Price" : "price",
    "Free Of Cost" : "freeofcost",
    "Financer/Leaser name" : "financerName",
     "Quantity" : "quantity",
    "Tenure" : "tenure",
    "Amount" : "amount",
    "Rate" : "rate",
    "Margin" : "margin",
    "Processing Fee":"processingfee",
    "Installment":"installment",
    "Free Of Cost":"freecost",
    "Date Of Request":"createdAt"
  }

  exports.create = function(req, res,next) {
      var model = new Offer(req.body);
            model.save(function(err, st) {
            if(err) { return res.status(500).send(err); }
                return res.status(200).json({message:"Data saved sucessfully"});
            });
  
  
    };
 
    exports.get = function(req,res){
        var queryParam = req.query;
        var filter = {};
        if (queryParam.searchStr) {
            filter['$text'] = {
              '$search': "\""+queryParam.searchStr+"\""
            }
        }
         if (queryParam.location) {
            filter['$text'] = {
              '$search': "\""+queryParam.location+"\""
            }
        }
        if (queryParam.status)
          filter.status = queryParam.status;
        if (queryParam.categoryId)
          filter['category.id'] = queryParam.categoryId;
        if (queryParam.brandId)
          filter['brand.id'] = queryParam.brandId;
        if (queryParam.modelId)
          filter['model.id'] = queryParam.modelId;
        if (queryParam.stateName)
          filter['location.name'] = queryParam.stateName;
        if(queryParam.pagination){
          return Utility.paginatedResult(req, res, Offer, filter, {});
        }
        
        var query = Offer.find(filter);
        query.exec(function(err, result) {
          if (err) {
            return handleError(res, err);
          }
          req.result = result;
          if(queryParam.type == 'excel')
            renderOfferMasterExcel(req,res);
          else
            renderJSON(req,res); 
          //return res.status(200).json(result);
        });
    };

    exports.update = function(req, res) {
          req.body.updatedAt = new Date();
          Offer.update({_id:req.params.id},{$set:req.body},function(err){

           if(err){ 

                res.status(err.status || 500).send(err);
            }
            
            return res.status(200).json(req.body);

          });
     };
      
     exports.destroy = function(req, res, next) {
      Offer.findById(req.params.id, function(err, oneRow) {
        if (err) {
          return handleError(res, err);
        }
        if (!oneRow) {
          return next(new ApiError(404, "Not found"));
        }
        oneRow.remove(function(err) {
          if (err) {
            return handleError(res, err);
          }
          return res.status(204).send({
            message: "Data deleted sucessfully!!!"
          });
        });
      });
    };

  function renderOfferMasterExcel(req,res){
    var dataArr = [];
    var keys = Object.keys(Offer_Master_Excel_Header);
    var dataKeys = Object.keys()
    dataArr[dataArr.length] = keys;
    req.result.forEach(function(item){
      var rowData = [];
      keys.forEach(function(key){
        var val = _.get(item,Offer_Master_Excel_Header[key],"");
        if(Offer_Master_Excel_Header[key] == 'locations' && item.location.length){
          val = "";
          item.location.forEach(function(location){
            val += location.name + ",";
          });
          val = val.substring(0,val.length - 1);
        }
        if(Offer_Master_Excel_Header[key] == 'cash_purchase')
          val = item.cash_purchase ? "Yes" : "No";
         if(Offer_Master_Excel_Header[key] == 'finance')
          val = item.finance ? "Yes" : "No";
         if(Offer_Master_Excel_Header[key] == 'lease')
          val = item.lease? "Yes" : "No";
          if(Offer_Master_Excel_Header[key] == "createdAt")
            val = moment(item.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
        rowData.push(val);
      });
      if(rowData.length)
        dataArr.push(rowData)
    }); 
    var ws = Utility.excel_from_data(dataArr,keys);
    var ws_name = "OfferReq_" + new Date().getTime();
    var wb = Utility.getWorkbook();
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;
    var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
    res.end(wbout);
  }
  

  //Offer request api

 exports.createOfferRequest = function(req, res,next) {
      var model = new OfferRequest(req.body);
      model.save(function(err, result) {
      if(err) { return res.status(500).send(err); }
          return res.status(200).json(result);
      });
  };

  exports.getOfferRequest = function(req,res){
     var filter = {};
      var queryParam = req.query;
      if (queryParam.searchstr) {
           filter['$text'] = {
            '$search': "\""+queryParam.searchstr+"\""
          }
      }

      if(queryParam.pagination){
        return Utility.paginatedResult(req, res, OfferRequest, filter, {},function(resultData){
          //console.log(resultData);
          var resultArr = formatData(resultData.items);
          resultData.items = resultArr;
          return res.status(200).json(resultData);
        });
      }
      console.log("hi");
      var limit = 1000;
      if(queryParam.limit && queryParam.limit < 1000)
        limit = queryParam.limit;
      var query = OfferRequest.find(filter).limit(limit).sort({createdAt:-1});
      query.exec(function(err,result){
        if(err) return handleError(res,err);
        req.result = result;
        if(queryParam.type == 'excel')
          renderExcel(req,res);
        else
          renderJSON(req,res);                            
      });
  }

  function renderJSON(req,res){
    var result = formatData(req.result);
    return res.status(200).json(result);
  }

  function formatData(resultArr){
    var dataArr = [];
    if(!resultArr || !resultArr.length)
      return dataArr;
    resultArr.forEach(function(item){
      item = item.toObject();
      item.orders = [];
      if(item.cashOffer && item.cashOffer.length){
        item.cashOffer.forEach(function(cash){
          cash.type = "Cash";
          item.orders.push(cash);
        });
      }
      if(item.financeOffer && item.financeOffer.length){
         item.financeOffer.forEach(function(finace){
          finace.type = "Finace";
          item.orders.push(finace);
        });
      }
     
     if(item.leaseOffer && item.leaseOffer.length){
      item.leaseOffer.forEach(function(lease){
        lease.type = "Lease";
        item.orders.push(lease);
      });
     }
      dataArr.push(item);
    });
    return dataArr;
  }

  function renderExcel(req,res){
    var dataArr = [];
    var keys = Object.keys(Excel_Header);
    var dataKeys = Object.keys(Data_Excel_Header);
    dataArr[dataArr.length] = keys;
    dataArr[0] = dataArr[0].concat(dataKeys);
    var resultArr = formatData(req.result);
    if(!resultArr || !resultArr.length)
      return handleError(res, "There is no data found to export");

    resultArr.forEach(function(item){
      var rowData = [];
      keys.forEach(function(key){
        var val = _.get(item,Excel_Header[key],"");
        if(Excel_Header[key] == 'customerName')
          val = item.fname + " " + item.lname;
        if(Excel_Header[key] == "requestRaisedBy"){
          if(item.isForSelf)
            val = "Self";
          else
            val = item.user.name || "";
        }
        rowData.push(val);
      });
      if(!item.orders || !item.orders.length)
        return;
      item.orders.forEach(function(order,idx){
        var row = [].concat(rowData);
        row[5] = row[5] + "." + (idx + 1);
        dataKeys.forEach(function(key){
          var val = _.get(order,Data_Excel_Header[key],"");
          if(Data_Excel_Header[key] == "createdAt"){
            val = moment(item.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
          }
          row.push(val);
        });
        dataArr.push(row);
      });
    }); 
    var ws = Utility.excel_from_data(dataArr,dataArr[0]);
    var ws_name = "OfferReq_" + new Date().getTime();
    var wb = Utility.getWorkbook();
    wb.SheetNames.push(ws_name);
    wb.Sheets[ws_name] = ws;
    var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
    res.end(wbout);
  }

function handleError(res, err) {
  return res.status(500).send(err);
}



