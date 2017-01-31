'use strict';

//var _ = require('lodash');
var Negotiation = require('./negotiation.model');


// Get list of services


// Creates a new service in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  // var prQuote = validateProductQuote(req.body);
  req.body.createdAt = new Date();
  Negotiation.create(req.body, function(err, service) {
    if(err) { return handleError(res, err); }
    console.log(service);
    return res.status(200).json(service);
  });
};

//export data into excel


function handleError(res, err) {
  return res.status(500).send(err);
}