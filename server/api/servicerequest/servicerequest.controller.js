'use strict';

var _ = require('lodash');
var ServiceRequest = require('./servicerequest.model');
var email = require('./../../components/sendEmail.js');

//search based on service type
exports.getService = function(req, res) {
  var filter = {};
  var query = ServiceRequest.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, svcRequest) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(svcRequest);
               }
  );
};

// Creates a new service in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  ServiceRequest.create(req.body, function(err, request) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(request);
  });
};


function handleError(res, err) {
  return res.status(500).send(err);
}