'use strict';

var _ = require('lodash');
var Bid = require('./bid.model');

// Get list of bids
exports.getAllBid = function(req, res) {
  Bid.find(function (err, bids) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(bids);
  });
};

// Get a single bid
/*exports.getOnId = function(req, res) {
  Bid.findById(req.params.id, function (err, bid) {
    if(err) { return handleError(res, err); }
    if(!bid) { return res.status(404).send('Not Found'); }
    return res.json(bid);
  });
};*/

// Creates a new valuation in the DB.
exports.createBid = function(req, res) {
  Bid.create(req.body, function(err, banner) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Bid saved sucessfully"});
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  
  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;
  if(req.body.userId)
    filter["user._id"] = req.body.userId;
  var query = Bid.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, bids) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(bids);
               }
  );
};

// Updates an existing bid in the DB.
exports.updateBid = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Bid.findById(req.params.id, function (err, bid) {
    if (err) { return handleError(res, err); }
    if(!bid) { return res.status(404).send('Not Found'); }
    Bid.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Bid updated sucessfully"});
    });
  });
};

// Deletes a bid from the DB.
exports.deleteBid = function(req, res) {
  Bid.findById(req.params.id, function (err, bid) {
    if(err) { return handleError(res, err); }
    if(!bid) { return res.status(404).send('Not Found'); }
    bid.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
