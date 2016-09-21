'use strict';

var _ = require('lodash');
var AuctionRequest = require('./auction.model');

// Get list of auctions
exports.getAll = function(req, res) {
  AuctionRequest.find(function (err, auctions) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(auctions);
  });
};

// Get a single auction
exports.getOnId = function(req, res) {
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if(err) { return handleError(res, err); }
    if(!auction) { return res.status(404).send('Not Found'); }
    return res.json(auction);
  });
};

// Creates a new valuation in the DB.
exports.create = function(req, res) {
  console.log("buyer created");
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  AuctionRequest.create(req.body, function(err, auction) {
        return res.status(201).json(auction);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  
  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;
  if(req.body.userId)
    filter["user._id"] = req.body.userId;
  var query = AuctionRequest.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, auctions) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(auctions);
               }
  );
};

// Updates an existing auction in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if (err) { return handleError(res, err); }
    if(!auction) { return res.status(404).send('Not Found'); }
     AuctionRequest.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
      });
    });
};

// Deletes a auction from the DB.
exports.destroy = function(req, res) {
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if(err) { return handleError(res, err); }
    if(!auction) { return res.status(404).send('Not Found'); }
    auction.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
