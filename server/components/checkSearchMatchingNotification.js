'use strict';

var Product = require('../api/product/product.model');
var SavedSearch = require('../api/common/savedsearch.model');
var config = require('../config/environment');
var commonController = require('../api/common/common.controller');
var notification = require('./notification.js');
var FEEDBACK_TEMPLATE_NAME = "productSearchMatchingItemToCustomer";

function getAllSaveSearch(){
  var filter = {};
  filter["emailNotification"] = true;
 SavedSearch.find(filter).exec(function (err, data) {
      if (err) { 
        return console.log(err);
        setTimeout(function () { getAllSaveSearch(); }, 1*24*60*60*1000); //sleep 1*24*60*60*1000
      }
      else {
        //console.log("searchData##", data);
          getMatchingProductList(data);
      }
  });
}

function getMatchingProductList(data){
  if(data && data.length > 0){
  var qr = data[0];
  
  var filter = {};
  filter['status'] = true;
  filter['deleted'] = false;
  var found = false;

  if(qr.filter.category){
    filter['category.name'] = qr.filter.category;
    found = true;
   }

  if(qr.checkSendMailDate){
    var dateFilter = {};
    dateFilter['$gte'] = new Date(qr.checkSendMailDate);
    filter["createdAt"] = dateFilter;
  }

  if(!found || !qr.user.email){
    data.splice(0,1);
    getMatchingProductList(data);
    return;
  }
    Product.find(filter).exec(function (err, products) {
        if (err) { 
          console.log(err);
          data.splice(0,1);
          getMatchingProductList(data);
          return;
        }
        else {
            if(products.length > 0){
              var productArr = {};
              productArr.productLists = [];
              createProductArr(products,qr,productArr);
              pushNotification(data,qr,productArr);
            }else{
              data.splice(0,1);
              getMatchingProductList(data);  
            }            
        }
    });
  } else {
     setTimeout(function () { getAllSaveSearch(); }, 1*24*60*60*1000); //sleep 1*24*60*60*1000
  }
}

function createProductArr(products,qr,productArr){
  products.forEach(function(item){
    if(productArr){
      productArr.productLists[productArr.productLists.length] = item;
    }
  });
}

function pushNotification(data,qr,productArr){
   try{
    console.log("pushNotification",qr.user.email);
        var emailData = {};
        emailData.to = qr.user.email;
        var tmplName = FEEDBACK_TEMPLATE_NAME;
        emailData.notificationType = "email";
        emailData.subject = "Search Matching Item";
        commonController.compileTemplate(productArr, config.serverPath, tmplName, function(ret,res){
          if(!ret){
              data.splice(0,1);
              getMatchingProductList(data); 
          }else{
              emailData.content =  res;
              notification.pushNotification(emailData);
              updateSearchQuery(data,qr);
          }
        });
    }
    catch (ex) {
       data.splice(0,1);
       getMatchingProductList(data);
    }
}

function updateSearchQuery(data, qr){

   var _id = qr._id;
    delete qr._id;
    //qr.notifyCounter = 1;
    qr.checkSendMailDate = new Date();
    qr.updatedAt = new Date();
    SavedSearch.update({ _id:_id }, {$set:qr}, function (err) {
       data.splice(0,1);
        getMatchingProductList(data);
    });
}

exports.start = function(){
  console.log("Save Search service started");
  getAllSaveSearch();
}
 