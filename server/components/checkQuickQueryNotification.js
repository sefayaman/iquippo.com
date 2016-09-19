'use strict';

var Product = require('../api/product/product.model');
var Quote = require('../api/quote/quote.model');
var config = require('../config/environment');
var commonController = require('../api/common/common.controller');
var notification = require('./notification.js');
var FEEDBACK_TEMPLATE_NAME = "productEnquiriesRequestForQuoteFeedbackToCustomer";

function getAllQuery(){
  var filter = {};
  filter["notifyCounter"] = 0;
 Quote.find(filter).exec(function (err, data) {
      if (err) { 
        return console.log(err);
        setTimeout(function () { getAllQuery(); }, 1*24*60*60*1000); //sleep 1*24*60*60*1000
      }
      else {
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
  filter['$or'] = [];
  var bestComb = {};
  var bestSimilarComb = {};
  var similarComb = {};
  var found = false;

  if(qr.category && qr.brand && qr.model){
    bestComb['category.name'] = qr.category;
    bestComb['brand.name'] = qr.brand;
    bestComb['model.name'] = qr.model;
    filter['$or'].push(bestComb);
    found = true;
  }

if(qr.category && qr.brand){
    bestSimilarComb['category.name'] = qr.category;
    bestSimilarComb['brand.name'] = qr.brand;
    filter['$or'].push(bestSimilarComb);
    found = true;
  }

  if(qr.category){
      similarComb['category.name'] = qr.category;
      filter['$or'].push(similarComb);
      found = true;
   }

  if(!found || !qr.email){
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
            ///console.log("products.length---", products.length);
            if(products.length > 0){
              var sortedProducts = {};
              sortedProducts.similar = [];
              sortProduct(products,qr,sortedProducts);
              if(sortedProducts.similar.length == 0)
                delete sortedProducts.similar;
              sortedProducts.date = new Date();
              sortedProducts.contactNumber = config.contactNumber;
              pushNotification(data,qr,sortedProducts);
            }else{
              data.splice(0,1);
              getMatchingProductList(data);  
            }            
        }
    });
  } else {
     setTimeout(function () { getAllQuery(); }, 1*24*60*60*1000); //sleep 1*24*60*60*1000
  }
}

function sortProduct(products,qr,sortedProducts){
  products.forEach(function(item){
    if(!sortedProducts.best && item.category.name == qr.category && item.brand.name == qr.brand && item.model.name == qr.model){
      sortedProducts.best = item;
    }else{
      sortedProducts.similar[sortedProducts.similar.length] = item;
      }
  });
}
/*function sortProduct(products,qr,sortedProducts){
  var colCounter = 0;
  var rowCounter = 0;
  sortedProducts.similar[sortedProducts.similar.length] = [];
  products.forEach(function(item){
    if(!sortedProducts.best && item.category.name == qr.category && item.brand.name == qr.brand && item.model.name == qr.model){
      sortedProducts.best = item;
    }else{
      sortedProducts.similar[rowCounter][colCounter] = item;
      colCounter ++;
      if(colCounter == 3){
          colCounter = 0;
          sortedProducts.similar[sortedProducts.similar.length] = [];
          rowCounter++;
        }
      }
  });
}*/

function pushNotification(data,qr,sortedProduct){
   try{
        var emailData = {};
        emailData.to = qr.email;
        var tmplName = FEEDBACK_TEMPLATE_NAME;
        emailData.notificationType = "email";
        emailData.subject = "Product Exist Now";
        commonController.compileTemplate(sortedProduct, config.serverPath, tmplName, function(ret,res){
          if(!ret){
              data.splice(0,1);
              getMatchingProductList(data); 
          }else{
              emailData.content =  res;
              ////console.log('email data',emailData);
              notification.pushNotification(emailData);
              updateQuoteQuery(data,qr);
          }
        });
    }
    catch (ex) {
       data.splice(0,1);
       getMatchingProductList(data);
    }
}

function updateQuoteQuery(data, qr){

   var _id = qr._id;
    delete qr._id;
    qr.notifyCounter = 1;
    qr.updatedAt = new Date();
    Quote.update({ _id:_id }, {$set:qr}, function (err) {
       data.splice(0,1);
        getMatchingProductList(data);
    });
}

exports.start = function(){
  console.log("Query service started");
  getAllQuery();
}
 