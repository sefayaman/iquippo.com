'use strict';

var _ = require('lodash');
var Callback = require('./callback.model');

// Get list of callback
exports.getAll = function(req, res) {
  Callback.find(function (err, callback) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(callback);
  });
};

// Get a single callback
exports.getOnId = function(req, res) {
  Callback.findById(req.params.id, function (err, callback) {
    if(err) { return handleError(res, err); }
    if(!callback) { return res.status(404).send('Not Found'); }
    return res.json(callback);
  });
};

// Creates a new callback in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  Callback.create(req.body, function(err, callback) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(callback);
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}