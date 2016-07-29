'use strict';

var _ = require('lodash');

var Product = require('./../product/product.model');
var Cart = require('./../cart/cart.model');
var AppNotification = require('./appNotification.model');
var config = require('./../../config/environment');

  exports.createNotification = function(req, res) {
    var pData = req.body;
    
    if(pData.product.status && pData.product.assetStatus == "listed")
    {
      create(req, res);
    } else if(pData.product.status && (pData.product.assetStatus == "rented" || pData.product.assetStatus == "sold")){
      checkProductInCart(pData);
    }
  };

  function checkProductInCart(pData){
    var filter = {};
    console.log("pData._id", pData.product._id);
    filter["products._id"] = pData.product._id;
    Cart.find(filter).exec(function (err, cartsData) {
      if (err) { 
        return console.log(err);
      }
      else {
        pushAppNotification(pData, cartsData);
      }
  });
  }

  function pushAppNotification(pData, cartsData){
    if(cartsData && cartsData.length > 0){
    var cData = cartsData[0];
    var dataToSend = {};
    dataToSend.user = {};
    dataToSend.product = {};
    dataToSend.user._id = cData.user._id;
    dataToSend.user.name = cData.user.name;
    dataToSend.product._id = pData.product._id;
    dataToSend.product.productId = pData.product.productId;
    dataToSend.product.assetId = pData.product.assetId;
    dataToSend.product.name = pData.product.name;
    dataToSend.product.assetStatus = pData.product.assetStatus;
    dataToSend.product.status = pData.product.status;
    dataToSend.product.assetDir = pData.product.assetDir;
    dataToSend.product.primaryImg = pData.product.primaryImg;
    dataToSend.product.createdAt = pData.product.createdAt;
    dataToSend.product.updatedAt = pData.product.updatedAt;
    dataToSend.createdAt = new Date();
    dataToSend.updatedAt = new Date();
    AppNotification.create(dataToSend, function(err, data) {
      if(err) { 
       cartsData.splice(0,1);
       pushAppNotification(pData, cartsData);
      }
      else{
        cartsData.splice(0,1);
        pushAppNotification(pData, cartsData);
     }
    });
    } else {
      console.log("No Record Found");
    }
  }

exports.createAppNotification = createAppNotification;

  function createAppNotification(dataToSend) {
    AppNotification.create(dataToSend, function(err, data) {
      if(err) { 
        console.log("Error", err);
      }
    });
  }


 function create(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();

  AppNotification.create(req.body, function(err, data) {
    if(err) { return handleError(res, err); }
     return res.status(200).json(data);
  });
};

//search products
exports.search = function(req, res) {
  var filter = {};
  if(typeof req.body.notificationStatus !== 'undefined' && !req.body.notificationStatus)
    filter["notificationStatus"] = req.body.notificationStatus;
  else
    delete filter.notificationStatus;
  if(req.body._id)
    filter["user._id"] = req.body._id;
  var query = AppNotification.find(filter).sort( { createdAt: -1 } );
  query.exec(
               function (err, products) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(products);
               }
  );

};

exports.updateAppNotification = function(req,res){
  var ids = req.body.ids;
  var userId = req.body._id;
  var obj = {};
  obj['updatedAt'] = new Date();
  obj['notificationStatus'] = true;
  AppNotification.update({'product._id':{$in:ids}, 'user._id': userId},{$set:obj},{multi:true},function(err,data){
    if(err) { return handleError(res, err); }
    return res.status(200).send('');
  });
}

function handleError(res, err) {
  console.log(err);
  return res.status(500).send(err);
}