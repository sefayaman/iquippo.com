'use strict';

var _ = require('lodash');
var Vendor = require('./vendor.model');
var User = require('./../user/user.model');

// Get list of vendor
exports.getAll = function(req, res) {
  console.log("find Vendor");
  var filter = {}
  filter['deleted'] = false;
  Vendor.find(filter, function (err, vendor) {
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

exports.validate = function(req, res){
  var filter = {}
  if(!req.body.mobile)
    return res.status(401).send('Insufficient data');
  if(req.body.userid)
     filter['_id'] = {$ne:req.body.userid}; 
  if(req.body.mobile)
    filter['mobile'] = req.body.mobile;
  filter['deleted'] = false;

  User.find(filter,function(err,users){
    if(err){ return handleError(res, err); }
    else if(users.length > 0){
      return res.status(200).json({errorCode:1,message:"Mobile number is already in used", user: users[0]});
    }
    else {
          if(!req.body.email) 
            return res.status(200).json({errorCode:0,message:""});

          filter = {}
          if(req.body.userid)
            filter['_id'] = {$ne:req.body.userid}; 
          filter['email'] = req.body.email;
          filter['deleted'] = false;
          User.find(filter,function(err,users){
             if(err){ return handleError(res, err); }
             else if(users.length > 0){
                return res.status(200).json({errorCode:2,message:"Email is already in used", user: users[0]});
             }
           else
          return res.status(200).json({errorCode:0,message:""});
        })
    }
  });
}

// Creates a new vendor in the DB.
exports.create = function(req, res) {
  var filter = {}
  if(!req.body.entityName)
    return res.status(401).send('Insufficient data');
  
  //if(req.body.entityName)
  filter['entityName'] = req.body.entityName;
  //var term = new RegExp("^" + req.body.entityName + "$", 'i');
  Vendor.find(filter,function(err,vendors){
    if(err) return handleError(res, err); 
    if(vendors.length > 0){
      return res.status(200).json({errorCode:1, message:"Entity Name already exist."});
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

    var dataObj = {};
    dataObj['fname'] = req.body.user.fname;
      if(req.body.user.mname)
    dataObj['mname'] = req.body.user.mname;
    dataObj['lname'] = req.body.user.lname;
    dataObj['email'] = req.body.user.email;
    dataObj['mobile'] = req.body.user.mobile;
    if(req.body.user.phone)
      dataObj['phone'] = req.body.user.phone;
    dataObj['city'] = req.body.user.city;
    if(req.body.user.state)
      dataObj['state'] = req.body.user.state;
    dataObj['imgsrc'] = req.body.user.imgsrc;
    dataObj.updatedAt = new Date();
    if(req.body.status)
      dataObj['isPartner'] = true;
    else
      dataObj['isPartner'] = false;
    User.update({_id:req.body.user.userId},{$set:dataObj},function(err,userObj){
      if(err){return handleError(res, err);}
    });
    return res.status(200).send("success");
  });
};

// Deletes a vendor from the DB.
exports.destroy = function(req, res) {
  var userId = req.params.id;
  Vendor.findById(userId, function (err, vendor) {
    if(err) { return handleError(res, err); }
    if(!vendor) { return res.status(404).send('Not Found'); }
    /*vendor.remove(function(err) {
      if(err) { return handleError(res, err); }
      req.body.isPartner = false;
      User.update(req, res);
      return res.status(204).send('No Content');
    });*/
    Vendor.update({_id:userId},{$set:{deleted:true,status:false}},function(err,user){
      if(err){ return handleError(res, err); }
      return res.status(200).json({errorCode:0,message:""})
    })
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}