'use strict';

var _ = require('lodash');
var Quote = require('./quote.model');
var Product = require('./../product/product.model');
var commonController = require('./../common/common.controller');
var notification = require('./../../components/notification.js');
var config = require('./../../config/environment');
var FEEDBACK_TEMPLATE_NAME = "productEnquiriesRequestForQuoteFeedbackToCustomer";

// Get list of quote
exports.getAll = function(req, res) {
  Quote.find(function (err, quote) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(quote);
  });
};

// Get a single quote
exports.getOnId = function(req, res) {
  Quote.findById(req.params.id, function (err, quote) {
    if(err) { return handleError(res, err); }
    if(!quote) { return res.status(404).send('Not Found'); }
    return res.json(quote);
  });
};

////////
// Creates a new quote in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  Quote.create(req.body, function(err, quote) {
    if(err) { return handleError(res, err); }
    if(req.body.category && req.body.brand && req.body.model)
      findBestMatch(req,res);
    else
      return res.status(201).json(quote);
  });
};

function findBestMatch(req,res){
  var catTerm = new RegExp("^" + req.body.category + "$", 'i');
  var brTerm = new RegExp("^" + req.body.brand + "$", 'i');
  var mdTerm = new RegExp("^" + req.body.model + "$", 'i');
  Product.find({'category.name':catTerm,'brand.name':brTerm,'model.name':mdTerm},function(err,prds){
    if(err){return handleError(res, err);}
    if(prds && prds.length > 0){
      pushNotification(req,res,prds[0]);
    }else
      return res.status(201).json({});
  });

}

function pushNotification(req,res,product){
   try{
        var emailData = {};
        emailData.to = "subhash.patel@bharatconnect.com";//req.body.email;
        var tmplName = FEEDBACK_TEMPLATE_NAME;
        emailData.notificationType = "email";
        emailData.subject = "Product Exist Now";
        var tplData = {};
        tplData.date = new Date();
        tplData.contactNumber = config.contactNumber;
        tplData.best = product;
        commonController.compileTemplate(tplData, config.serverPath, tmplName, function(ret,retData){
          if(!ret){
              res.status(500).send("");
          }else{
              emailData.content =  retData;
              notification.pushNotification(emailData,function(pushed){
                return res.status(201).json({});
              });
          }
        });
    }
    catch (ex) {
      return handleError(res,ex);
    }
}

function handleError(res, err) {
  return res.status(500).send(err);
}