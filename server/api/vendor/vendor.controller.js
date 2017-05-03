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
  if(req.body.isPartner)
    filter['isPartner'] = req.body.isPartner;
  
  User.find(filter,function(err,users){
    if(err){ return handleError(res, err); }
    else if(users.length > 0){
      return res.status(200).json({errorCode:1,message:"Mobile number is already registered as partner", user: users[0]});
    }
    else {
          if(!req.body.email) 
            return res.status(200).json({errorCode:0,message:""});

          filter = {}
          if(req.body.userid)
            filter['_id'] = {$ne:req.body.userid}; 
          filter['email'] = req.body.email;
          if(req.body.isPartner)
            filter['isPartner'] = req.body.isPartner;
          filter['deleted'] = false;
          User.find(filter,function(err,users){
             if(err){ return handleError(res, err); }
             else if(users.length > 0){
                return res.status(200).json({errorCode:2,message:"Email is already registered as partner", user: users[0]});
             }
           else
          return res.status(200).json({errorCode:0,message:""});
        })
    }
  });
}

/*exports.validateVendor = function(req, res){
  var filter = {}
  if(!req.body.entityName)
    return res.status(401).send('Insufficient data');
  if(req.body._id)
     filter['_id'] = {$ne:req.body._id}; 
  if(req.body.entityName)
    filter['entityName'] = req.body.entityName;
  filter['deleted'] = false;
  console.log("req.body._id", req.body);
  console.log("filter", filter);
  Vendor.find(filter,function(err,vendors){
    if(err){ return handleError(res, err); }
    else if(vendors.length > 0){

      return res.status(200).json({errorCode:1,message:"Entity name is already in exist."});
    } else
     return res.status(200).json({errorCode:0,message:""});
  });
}*/

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
      if(!req.body.partnerId)
        req.body.partnerId = "QP" + req.body.user.mobile + "" + Math.floor(Math.random()*10);
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
  var filter = {}
  if(!req.body.entityName)
    return res.status(401).send('Insufficient data');
  if(_id)
     filter['_id'] = {$ne:_id}; 
  if(req.body.entityName)
    filter['entityName'] = req.body.entityName;
  Vendor.find(filter,function(err,vendors){
    if(err) return handleError(res, err); 
    if(vendors.length > 0){
      return res.status(200).json({errorCode:1, message:"Entity Name already exist."});
    } else {
       if(!req.body.partnerId)
           req.body.partnerId = "QP" + req.body.user.mobile + "" + Math.floor(Math.random()*10);;
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
        return res.status(200).json({errorCode:0, message:"Success"});
      });
    }
  });
}

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

//search based on service type
exports.getFilteredUser = function(req, res) {
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  
  if(req.body.service){
    var term = new RegExp(req.body.service, 'i');
    filter['services'] = { $regex: term };
  }

  if(req.body.partnerId){
    filter["partnerId"] = req.body.partnerId;
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Vendor.find(filter).sort(sortObj); 
  query.exec(
               function (err, users) {
                      if(err) { return handleError(res, err); }
                      //console.log(users);
                      return res.status(200).json(users);
               }
  );
};

function handleError(res, err) {
  return res.status(500).send(err);
}