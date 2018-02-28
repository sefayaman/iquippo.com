'use strict';

var _ = require('lodash');
var Offer = require('./offer.model');
var OfferRequest = require('./newofferrequest.model');
var ApiError = require('../../components/_error');
var Utility = require('./../../components/utility.js');
var moment = require("moment");
var commonController = require('./common.controller');
var notification = require('./../../components/notification.js');
var Vendor = require('./../vendor/vendor.model');
var config = require('./../../config/environment');
var xlsx = require('xlsx');
var async = require('async');

var Offer_Master_Excel_Header = {
    "Serial No." : "serialNumber",
    "Category": "category.name",
    "Brand": "brand.name",
    "Model": "model.name",
    "Country":"country",
    "State": "locations"
};

var Offer_Master_Data_Excel_Header = {
    "Offer Type" : "type",
    "Price" : "price",
   /* "Free Of Cost" : "freeofcost",*/
    "Financer/Leaser name" : "financerName",
    "Tenure" : "tenure",
    "Amount" : "amount",
    "Rate" : "rate",
    "Margin" : "margin",
    "Processing Fee":"processingfee",
    "Installment":"installment",
    "Free Of Cost":"freecost",
    "Created At":"createdAt"
  }

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
   /* "Free Of Cost" : "freeofcost",*/
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
    var dataKeys = Object.keys(Offer_Master_Data_Excel_Header)
    dataArr[dataArr.length] = keys;
    dataArr[0] = dataArr[0].concat(dataKeys);
    var resultArr = formatData(req.result,true);
    if(!resultArr || !resultArr.length)
      return handleError(res, "There is no data found to export");
    resultArr.forEach(function(item,index){
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
        if(Offer_Master_Excel_Header[key] == 'serialNumber')
          val = index + 1;

        rowData.push(val);
      });
      if(!item.orders || !item.orders.length)
        return;
      item.orders.forEach(function(order,idx){
        var row = [].concat(rowData);
        row[0] = row[0] + "." + (idx + 1);
        dataKeys.forEach(function(key){
          var val = _.get(order,Offer_Master_Data_Excel_Header[key],"");
          if(Offer_Master_Data_Excel_Header[key] == "freecost"){
            val = order.freeofcost || order.freecost;
            if(val)
              val += "(" + order.type  + ")";
            else
              val = ""; 
          }
          if(Offer_Master_Data_Excel_Header[key] == "createdAt"){
            val = moment(item.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
          }
          row.push(val);
        });
        dataArr.push(row);
      });
      //if(rowData.length)
        //dataArr.push(rowData)
    }); 
    var ws = Utility.excel_from_data(dataArr,dataArr[0]);
    var ws_name = "Offer_master_" + new Date().getTime();
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
          //postNotification(result);
          return res.status(200).json(result);
      });
  };

  function postNotification(bodyData){
    bodyData.cash_purchase = bodyData.cashOffer && bodyData.cashOffer.length > 0? true:false;
    bodyData.finance = bodyData.financeOffer && bodyData.financeOffer.length > 0? true:false;
    bodyData.lease = bodyData.leaseOffer && bodyData.leaseOffer.length > 0? true:false;
    if(bodyData && bodyData.email){
        var userEmailData = {};
        userEmailData.subject = "User Subject --" + bodyData.orderId;
        userEmailData.to = bodyData.email;
        userEmailData.notificationType = "email";
        sendEmail(bodyData,userEmailData,"OfferEmailCustomer",null);
        var adminMailData = {};
        adminMailData.subject = "Admin Subject -- " + bodyData.orderId;
        adminMailData.to = config.supportMail;
        adminMailData.notificationType = "email";
        sendEmail(bodyData,adminMailData,"OfferEmailCustomer",null);
      }

      var enterpriseData = {};
      if(bodyData.financeOffer && bodyData.financeOffer.length){
        bodyData.financeOffer.forEach(function(fiOffer){
          if(!enterpriseData[fiOffer.financerId]){
            enterpriseData[fiOffer.financerId] =  {};
            enterpriseData[fiOffer.financerId].financeOffer = [];
          }
            fiOffer.type = "fi";
            enterpriseData[fiOffer.financerId].financeOffer.push(fiOffer);
        });
      }

      if(bodyData.leaseOffer && bodyData.leaseOffer.length){
        bodyData.leaseOffer.forEach(function(liOffer){
          if(!enterpriseData[liOffer.financerId]){
              enterpriseData[liOffer.financerId] = {};
              enterpriseData[liOffer.financerId].leaseOffer = [];
          }
          if(enterpriseData[liOffer.financerId] && !enterpriseData[liOffer.financerId].leaseOffer)
              enterpriseData[liOffer.financerId].leaseOffer = [];

            liOffer.type = "li";
            enterpriseData[liOffer.financerId].leaseOffer.push(liOffer);
        });
      }

      var keys = Object.keys(enterpriseData);
      if(!keys.length)
        return;
      var dataArr = [];
      keys.forEach(function(key){
        var obj = {};
        obj.category = bodyData.category;
        obj.brand = bodyData.brand;
        obj.model = bodyData.model;
        obj.orderId = bodyData.orderId;
        obj.user = bodyData.user;
        obj.name = bodyData.fname + " " + bodyData.lname;
        obj.mobile = bodyData.mobile;
        obj.email = bodyData.email;
        obj.assetId = bodyData.assetId;
        obj.assetDir = bodyData.assetDir;
        obj.primaryImg = bodyData.primaryImg;
        obj.data = enterpriseData[key];
        obj.finance = obj.data.financeOffer && obj.data.financeOffer.length?true:false;
        obj.lease = obj.data.leaseOffer && obj.data.leaseOffer.length?true:false;
        obj.financerId = key;
        dataArr.push(obj);
      });
      async.eachLimit(dataArr,2,initFinacerMail,function(err){
        if(err)
          console.log("err in sending offer request mail",err);
      });

      function initFinacerMail(data,cb){
        if(!data.financerId)
          return cb();
        Vendor.find({_id:data.financerId},function(err,vendors){
          if(err || !vendors || !vendors.length)
            return cb();
          var mailData = {};
          mailData.subject = "Finacer Subject --- " + bodyData.orderId;;
          mailData.to = vendors[0].user.email;
          mailData.notificationType = "email";
          data.financerName = vendors[0].entityName;
          sendEmail(data,mailData,"OfferEmailFinancer",null);
          return cb();
        });
      }
  }

 function sendEmail(tplData,emailData,tplName,cb) {
    commonController.compileTemplate(tplData, config.serverPath, tplName, function(success,retData){
      if(success){
        emailData.content =  retData;
        notification.pushNotification(emailData);
      }
    });
  }

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

  function formatData(resultArr,isOfferMaster){
    var dataArr = [];
    if(!resultArr || !resultArr.length)
      return dataArr;
    resultArr.forEach(function(item){
      item = item.toObject();
      item.orders = [];
      if(item.cashOffer && item.cashOffer.length && !isOfferMaster){
        item.cashOffer.forEach(function(cash){
          if(!cash)
            return;
          cash.type = "Cash";
          item.orders.push(cash);
        });
      }
       if(item.caseInfo && item.caseInfo.length && isOfferMaster){
        item.caseInfo.forEach(function(cash){
          if(!cash)
            return;
          cash.type = "Cash";
          item.orders.push(cash);
        });
      }
      if(item.financeOffer && item.financeOffer.length && !isOfferMaster){
         item.financeOffer.forEach(function(finace){
          if(!finace)
            return;
          finace.type = "Finance";
          item.orders.push(finace);
        });
      }

      if(item.financeInfo && item.financeInfo.length && isOfferMaster){
         item.financeInfo.forEach(function(finace){
          if(!finace || !finace.data)
            return;
          for(var key in finace.data){
            var dt = finace.data[key];
            dt.financerName = finace.name;
            dt.type = "Finance";
            item.orders.push(dt);
          }
        });
      }
     
     if(item.leaseOffer && item.leaseOffer.length && !isOfferMaster){
      item.leaseOffer.forEach(function(lease){
        if(!lease)
            return;
        lease.type = "Lease";
        item.orders.push(lease);
      });
     }

     if(item.leaseInfo && item.leaseInfo.length && isOfferMaster){
      item.leaseInfo.forEach(function(lease){
        if(!lease || !lease.data)
            return;
        for(var key in lease.data){
            var dt = lease.data[key];
            dt.finacerName = lease.name;
            dt.type = "Lease";
            item.orders.push(dt);
          }
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
        if(Excel_Header[key] == 'customerName') {
          if(item.lname) {
            val = item.fname + " " + item.lname;
          }
          else {
            val = item.fname;
          }
        }
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
          if(Data_Excel_Header[key] == "freecost"){
            val = order.freeofcost || order.freecost;
            if(val)
              val += "(" + order.type  + ")";
            else
               val = "";
          }
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



