'use strict';

var _ = require('lodash');

var Product = require('./../product/product.model');
var Cart = require('./../cart/cart.model');
var AppNotification = require('./appNotification.model');
var config = require('./../../config/environment');

exports.createAppNotification = createAppNotification;
exports.checkProductInCart = checkProductInCart;
  exports.create = function(req, res) {
    var data = req.body;
    
    if(data.notificationFor == 'Approved')
    {
      create(req, res);
    } else if(data.notificationFor == "Rented" || data.notificationFor == "Sold"){
      checkProductInCart(data,sendToClient,res);
    }else{
      return res.status(404).send('Invalid request');
    }
  };

  function checkProductInCart(pData,cb,res){
    var filter = {};
    filter["products._id"] = ""+ pData.productId;
    Cart.find(filter).exec(function (err, cartsData) {
      if (err) { return handleError;}
      else {
        //console.log("cartsData", cartsData.length);
        pushAppNotification(pData, cartsData,cb,res);
      }
  });
  }

  function pushAppNotification(pData, cartsData,cb,res){
    if(cartsData && cartsData.length > 0){
    //console.log("pushAppNotification");
    var cData = cartsData[0];
    var dataToSend = {};
    dataToSend.user = {};
    dataToSend.user._id = cData.user._id;
    dataToSend.user.name = cData.user.name;
    dataToSend.productId = pData.productId;
    dataToSend.message = pData.message;
    dataToSend.notificationFor = pData.notificationFor;
    dataToSend.imgsrc = pData.imgsrc;
    AppNotification.create(dataToSend, function(err, data) {
      if(err) { 
       cartsData.splice(0,1);
       pushAppNotification(pData, cartsData,cb,res);
      }
      else{
        //console.log("created###");
        cartsData.splice(0,1);
        pushAppNotification(pData, cartsData,cb,res);
     }
    });
    } else {
      if(cb && res)
          return cb(res);
      else
        cb();
    }
  }

  function sendToClient(res){
    res.status(200).send('Success');
  }

  function createAppNotification(product) {
    var dataToSend = {};
    dataToSend.user = {};
    dataToSend.user._id = product.seller._id;
    dataToSend.user.fname = product.seller.fname;
    dataToSend.productId = product._id;
    dataToSend.message = product.name;
    /*if(product.assetStatus == 'sold')
      productData.notificationFor = "Sold";
    else if(product.assetStatus == 'rented')
      productData.notificationFor = "Rented";
    else*/ 
    if(product.status && product.assetStatus == 'listed')
      dataToSend.notificationFor = "Approved";
    dataToSend.imgsrc = product.assetDir + "/"+ product.primaryImg;

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
  if(req.body.status)
    filter["status"] = req.body.status;
  else
    delete filter.status;
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
  var ids = req.body;
  //var userId = req.body._id;
  var obj = {};
  obj['updatedAt'] = new Date();
  obj['status'] = "read";
  AppNotification.update({_id:{$in:ids}},{$set:obj},{multi:true},function(err,data){
    if(err) { return handleError(res, err); }
    return res.status(200).send('');
  });
}

function handleError(res, err) {
  console.log(err);
  return res.status(500).send(err);
}