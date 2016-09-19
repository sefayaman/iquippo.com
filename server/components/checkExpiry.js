'use strict';

var Product = require('../api/product/product.model');
var config = require('../config/environment');
var commonController = require('../api/common/common.controller');
var notification = require('./notification.js');
var EXPIRY_DAYS = 60;
var NOTIFICATION_EXPIRY_DAYS = 7;
var EXPIRY_TEMPLATE_NAME = "productUploadEmailToCustomerExpiry";
var EXPIRY_TO_TEMPLATE_NAME = "productUploadNotificationEmailToCustomerExpiry";

function getExpiredProduct(){
 var today = new Date()
 var priorDate = new Date().setDate(today.getDate()- EXPIRY_DAYS);
  Product.find({relistingDate:{$lt:priorDate},expired:false,status:true}).exec(function (err, data) {
      if (err) { 
        return console.log(err);
         setTimeout(function () { getExpiredProduct(); }, 10*60*1000); //sleep 
      }
      else {
          console.log( "got data expired "+ data.length);
          sendNotification(data,true);
      }
  });
}

function getProductToExpire(){
 var today = new Date()
 var priorDate = new Date().setDate(today.getDate()- EXPIRY_DAYS + NOTIFICATION_EXPIRY_DAYS);
 var dt2 = new Date().setDate(today.getDate()- EXPIRY_DAYS + NOTIFICATION_EXPIRY_DAYS - 1)
 Product.find({relistingDate:{$lt:priorDate,$gte:dt2 },expired:false,status:true,expiryAlert:false}).exec(function (err, data) {
      if (err) { 
        return console.log(err);
         setTimeout(function () { getExpiredProduct(); }, 10*60*1000); //sleep 
      }
      else {
          console.log( "got data before expired "+ data.length);
          sendNotification(data,false);
      }
  });
}


function sendNotification(data,expired){

   try{
        if (data && data.length > 0) {
            var emailData = {};
            emailData.to = data[0].seller.email;
            var tmplName = EXPIRY_TEMPLATE_NAME;
            emailData.notificationType = "email";
            emailData.subject = "Product Expiry Notification";
            if(!expired){
                  tmplName = EXPIRY_TO_TEMPLATE_NAME;
                  emailData.subject = "Expiry Notification: Product Will Expiry after 7 days";
            }                              
            commonController.compileTemplate(data[0], config.serverPath, tmplName, function(ret,res){
              if(!ret){
                  console.log("error in template");
              }else{
                  emailData.content =  res;
                  //console.log('email data',emailData);
                  if(emailData.to)
                    notification.pushNotification(emailData);
                  updateProduct(data,expired);
              }
            });
          }
            else {
                if(!expired)
                    setTimeout(function () { getExpiredProduct(); }, 2*60*60*60*1000); //sleep 2*60*60*60*1000
                else
                  getProductToExpire();
            }
          
    }
    catch (ex) {
        console.log("Error expiry service");
        console.log(ex);
        setTimeout(function () { getExpiredProduct(); }, 10*60*1000); //sleep 10*60*1000
    }
}

function updateProduct(data,expired){
    var product = data[0];
    var _id = product._id;
    delete product._id;
    if(expired){
      product.expired = true;
      product.status = false;
      //product.featured = false;
    }else{
      product.expiryAlert = true;
    }
    
    product.updatedAt = new Date();
    Product.update({ _id:_id }, {$set:product}, function (err) {
      if (err) {
          console.log("Error with updating product");
      }
      data.shift();
      sendNotification(data,expired);
    })
}

exports.start = function(){
  console.log("Expiry service started");
  getExpiredProduct();
}
 