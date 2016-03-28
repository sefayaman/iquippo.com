'use strict';

var _ = require('lodash');
var Buyer = require('./buyer.model');

// Get list of buyer
exports.getAll = function(req, res) {
  Buyer.find(function (err, buyer) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(buyer);
  });
};

// Get a single buyer
exports.getOnId = function(req, res) {
  Buyer.findById(req.params.id, function (err, buyer) {
    if(err) { return handleError(res, err); }
    if(!buyer) { return res.status(404).send('Not Found'); }
    return res.json(buyer);
  });
};

// Creates a new buyer in the DB.
exports.create = function(req, res) {
  console.log("buyer created");
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Buyer.create(req.body, function(err, buyer) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(buyer);
  });
};
//search based on product _id
exports.search = function(req, res) {
  //var term = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  console.log("buyer created", req.body._id);
  if(req.body._id)
    filter["product._id"] = req.body._id;

  var query = Buyer.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, Buyer) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(Buyer);
               }
  );
};
// Updates an existing buyer in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Buyer.findById(req.params.id, function (err, buyer) {
    if (err) { return handleError(res, err); }
    if(!buyer) { return res.status(404).send('Not Found'); }
    var updated = _.merge(buyer, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(buyer);
    });
  });
};

// Deletes a buyer from the DB.
exports.destroy = function(req, res) {
  Buyer.findById(req.params.id, function (err, buyer) {
    if(err) { return handleError(res, err); }
    if(!buyer) { return res.status(404).send('Not Found'); }
    buyer.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}