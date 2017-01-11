'use strict';

var _ = require('lodash');
var Seq = require('seq');
var Bid = require('./bid.model');
var Utility = require('./../../components/utility.js');

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
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;
  if(req.body.userId)
    filter["user._id"] = req.body.userId;
  if(req.body.mobile)
    filter["user.mobile"] = req.body.mobile;
  var arr = [];
  if(req.body.searchstr){
    arr[arr.length] = { "bannerInfo.code": { $regex: searchStrReg }};
    arr[arr.length] = { "bannerInfo.name": { $regex: searchStrReg }};
    arr[arr.length] = { "user.fname": { $regex: searchStrReg }};
    arr[arr.length] = { "user.lname": { $regex: searchStrReg }};
    arr[arr.length] = { "user.mobile": { $regex: searchStrReg }};
    arr[arr.length] = { "user.email": { $regex: searchStrReg }};
    arr[arr.length] = { "paymentInfo.bankname": { $regex: searchStrReg }};
    arr[arr.length] = { "paymentInfo.checkno": { $regex: searchStrReg }};
    arr[arr.length] = { "paymentInfo.amount": { $regex: searchStrReg }};
    arr[arr.length] = { status: { $regex: searchStrReg }};
  }

  if(arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,Bid,filter,{});
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Bid.find(filter).sort(sortObj);
  Seq()
  .par(function(){
    var self = this;
    Bid.count(filter,function(err, counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){
    var self = this;
    query.exec(function (err, bids) {
        if(err) { return handleError(res, err); }
        result.bids = bids;
        self();
       }
    );

  })
  .seq(function(){
    return res.status(200).json(result.bids);
  })
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

// get 10 highest bids
exports.getHighestBids = function(req,res){
    var filter = {};
    //filter['status'] = true;
    if(req.body.bannerIds)
      filter['bannerInfo._id'] = {$in:req.body.bannerIds};
    Bid.aggregate(
    { $match:filter},
    { $group: 
      { _id: {
            'name': '$bannerInfo.name',
            'valueperunit': '$valueperunit'
        }, count: { $sum: 1 } } 
    },
    { $group: {
        _id: '$_id.name',
        valueperunits: { 
            $push: { 
                valueperunit: '$_id.valueperunit',
                total_count: '$count'
            },
        },
        total_count: { $sum: '$count' }
    }},
    {$sort:{count: -1}},
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}
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
