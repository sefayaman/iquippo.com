'use strict';

var _ = require('lodash');
var Vendor = require('./vendor.model');

// Get list of vendor
exports.getAll = function(req, res) {
  console.log("find Vendor");
  Vendor.find(function (err, vendor) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(vendor);
  });
};

// Get a single vendor
exports.getOnId = function(req, res) {
  Vendor.findById(req.params.id, function (err, vendor) {
    if(err) { return handleError(res, err); }
    if(!vendor) { return res.status(404).send('Not Found'); }
    return res.json(vendor);
  });
};

// Creates a new vendor in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  console.log(req.body.thumbnilurl);
  var term = new RegExp("^" + req.body.entityName + "$", 'i');
    Vendor.find({entityName:term},function(err,vendors){
      if(err) return handleError(res, err); 
      if(vendors.length > 0){
        return res.status(200).json({errorCode:1, message:"Vendor already exist."});
      }else{
        Vendor.create(req.body, function(err, vendor) {
          if(err) { return handleError(res, err); }
          return res.status(201).json({errorCode:0, message:""});
        });
      }
    })
  
};

// Updates an existing vendor in the DB.
exports.update = function(req, res) {
  var _id = req.body._id;
  if(req.body._id) { delete req.body._id;}
  //if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  Vendor.update({_id:_id},{$set:req.body},function (err) {
    if (err) {return handleError(res, err); }
    return res.status(200).send("success");
  });
};

// Deletes a vendor from the DB.
exports.destroy = function(req, res) {
  Vendor.findById(req.params.id, function (err, vendor) {
    if(err) { return handleError(res, err); }
    if(!vendor) { return res.status(404).send('Not Found'); }
    vendor.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}