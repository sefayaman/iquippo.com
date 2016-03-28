'use strict';

var _ = require('lodash');
var Quote = require('./quote.model');

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
    return res.status(201).json(quote);
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}