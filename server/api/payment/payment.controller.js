'use strict';

var _ = require('lodash');
var Payment = require('./payment.model');

// Get list of payment transaction
exports.getAll = function(req, res) {
  Payment.find(function (err, payments) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(payments);
  });
};

// Get a single Payment
exports.getOnId = function(req, res) {
  Payment.findById(req.params.id, function (err, payment) {
    if(err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
    return res.json(payment);
  });
};

// Creates a new payment in the DB.
exports.create = function(req, res) {
  console.log("Payement transaction created");
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Payement.create(req.body, function(err, payment) {
        return res.status(201).json(payment);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;

  var query = Payment.find(filter);
  query.exec(
               function (err, payments) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(payments);
               }
  );
};
// Updates an existing payment in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Payment.findById(req.params.id, function (err, payment) {
    if (err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
     Payment.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Deletes a payment from the DB.
exports.destroy = function(req, res) {

  Payment.findById(req.params.id, function (err, payment) {
    if(err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
    Payment.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
  
};

function handleError(res, err) {
  return res.status(500).send(err);
}
