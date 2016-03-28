'use strict';

var _ = require('lodash');
var ProductQuote = require('./productquote.model');
var email = require('./../../components/sendEmail.js');

// Get list of quote
exports.getAll = function(req, res) {
  ProductQuote.find(function (err, quote) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(quote);
  });
};

// Get a single quote
exports.getOnId = function(req, res) {
  ProductQuote.findById(req.params.id, function (err, quote) {
    if(err) { return handleError(res, err); }
    if(!quote) { return res.status(404).send('Not Found'); }
    return res.json(quote);
  });
};

//search based on product productId
exports.getAdditionalService = function(req, res) {
  var filter = {};
  if(req.body.productId)
    filter["product.productId"] = req.body.productId;

  var query = ProductQuote.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, addServices) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(addServices);
               }
  );
};

// Creates a new quote in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  // var prQuote = validateProductQuote(req.body);
  req.body.createdAt = new Date();
  ProductQuote.create(req.body, function(err, quote) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(quote);
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

/*function validateProductQuote(prQuote){
  var isPastLease = prQuote.leaseQuote.isPastLeasing;
  delete prQuote.leaseQuote.isPastLeasing;
  var pastLease = prQuote.leaseQuote.pastLease;
  delete prQuote.leaseQuote.pastLease;

  var leaseVendors = prQuote.leaseQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });
  delete prQuote.leaseQuote.vendors;

  var insuranceVendors = prQuote.insuranceQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });
  delete prQuote.insuranceQuote.vendors;

  var tVendors = prQuote.transportationQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });
  
  delete prQuote.transportationQuote.vendors;
  var valVendors = prQuote.valuationQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });

  delete prQuote.valuationQuote.vendors;

  if(_.isEmpty(prQuote.leaseQuote) && leaseVendors.length == 0){
      delete prQuote.leaseQuote;
  }else{
     prQuote.leaseQuote.vendors = leaseVendors;
     prQuote.leaseQuote.isPastLeasing = isPastLease;
     if(isPastLease == 'yes')
        prQuote.leaseQuote.pastLease = pastLease;
  }
  if(_.isEmpty(prQuote.transportationQuote) && tVendors.length == 0){
      delete prQuote.transportationQuote;
  }else{
     prQuote.transportationQuote.vendors = tVendors;
  }

  if(_.isEmpty(prQuote.insuranceQuote) && insuranceVendors.length == 0){
      delete prQuote.insuranceQuote;
  }else{
     prQuote.insuranceQuote.vendors = insuranceVendors;
    
  }

  if(_.isEmpty(prQuote.valuationQuote) && valVendors.length == 0){
      delete prQuote.valuationQuote;
  }else{
     prQuote.valuationQuote.vendors = valVendors;
    
  }

  return prQuote;
  
}*/