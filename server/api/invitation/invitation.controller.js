'use strict';

var _ = require('lodash');
var Coupon = require('./coupon.model');
var WalletTransaction = require('./wallettransaction.model');
//var InvitationMaster = require('./invitationsetting.model');

// Get a single invitation coupon
exports.getCouponOnId = function(req, res) {
  console.log("id###",req.params.id);
  Coupon.findOne({'user._id':req.params.id}, function (err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.status(200).json({errorCode:1,message:"Not Exist!!!"}); }
    return res.json(data);
  });
};

exports.checkCodeValidity = function(req,res){
  var data = req.body;
  var filter = {};
  filter["deleted"] = false;
  if(data.code)
    filter['code'] = data.code;
  if(data._id)
    filter['user._id'] = data._id;
  var currentDate = new Date();
  var validsDate = {};
  var valideDate = {};
  if(currentDate) {
    validsDate['$lte'] = currentDate.toISOString();
    valideDate['$gte'] = currentDate.toISOString();
  }
  filter["sDate"] = validsDate;
  filter["eDate"] = valideDate;
  console.log("filter####", filter);
  Coupon.findOne(filter, function (err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.status(200).json({errorCode:1,message:"Code Expired"})}
    return res.status(200).json(data);
  });
}

// Creates a new coupon in the DB.
exports.createCoupon = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Coupon.create(req.body, function(err, data) {
    if(err) { return handleError(res, err); }
     return res.status(200).json(data);
  });  
};

// Updates an existing coupon in the DB.
exports.updateCoupon = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  //if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  Coupon.findById(req.params.id, function (err, data) {
    if (err) { return handleError(res, err); }
    if(!data) { return res.status(404).send('Not Found'); }
    Coupon.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};


// Get a single invitation coupon
exports.getTransactionOnId = function(req, res) {
  console.log("id###",req.params.id);
  WalletTransaction.findOne({'user._id':req.params.id}, function (err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.status(404).send('Not Found'); }
    return res.json(data);
  });
};

// Creates a new coupon in the DB.
exports.createWalletTransaction = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  WalletTransaction.create(req.body, function(err, data) {
    if(err) { return handleError(res, err); }
     return res.status(200).json(data);
  }); 
};

// Updates an existing coupon in the DB.
exports.updateWalletTransaction = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  WalletTransaction.findById(req.params.id, function (err, data) {
    if (err) { return handleError(res, err); }
    if(!data) { return res.status(404).send('Not Found'); }
    WalletTransaction.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Get a joind user list
exports.getAllJoinedUsersOnId = function(req, res) {
  var filter = {};
  filter["deleted"] = false;
  if(req.body.refId)
    filter["refBy.refId"] = req.body.refId;
  if(req.body.code)
    filter["refBy.code"] = req.body.code;

  var query = Coupon.find(filter);
  query.exec(
               function (err, joinedusers) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(joinedusers);
               }
  );

};

function handleError(res, err) {
  console.log("called >>>>>>>>>",err);
  return res.status(500).send(err);
}