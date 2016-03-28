'use strict';

var _ = require('lodash');
var ContactUs = require('./contactus.model');

// Get list of contacts
exports.getAll = function(req, res) {
  ContactUs.find(function (err, contacts) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(contacts);
  });
};

// Get a single contact
exports.getOnId = function(req, res) {
  ContactUs.findById(req.params.id, function (err, contact) {
    if(err) { return handleError(res, err); }
    if(!contact) { return res.status(404).send('Not Found'); }
    return res.json(contact);
  });
};

// Creates a new contact in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  ContactUs.create(req.body, function(err, contact) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(contact);
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}