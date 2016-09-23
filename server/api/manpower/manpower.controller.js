'use strict';

var _ = require('lodash');
var ManpowerUser = require('./manpower.model');
var Product = require('./../product/product.model');
var User = require('./../user/user.model');
//var email = require('./../../components/sendEmail.js');
//var  xlsx = require('xlsx');

// Get list of services
exports.getAll = function(req, res) {
  ManpowerUser.find(function (err, users) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(users);
  });
};

// Get a single services
/*exports.getOnId = function(req, res) {
  ManpowerUser.findById(req.params.id, function (err, user) {
    if(err) { return handleError(res, err); }
    if(!user) { return res.status(404).send('Not Found'); }
    return res.json(user);
  });
};*/

exports.getOnId = function(req, res) {
  console.log("id###",req.params.id);
  ManpowerUser.findOne({'user.userId':req.params.id}, function (err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.status(200).json({errorCode:1,message:"Not Exist!!!"}); }
    return res.json(data);
  });
};

/*exports.validateSignup = function(req, res){
  var filter = {}
  if(!req.body.mobile)
    return res.status(401).send('Insufficient data');
  if(req.body.userid)
     filter['_id'] = {$ne:req.body.userid}; 
   if(req.body.mobile)
     filter['mobile'] = req.body.email;
  filter['deleted'] = false;
  ManpowerUser.find(filter,function(err,users){
    if(err){ return handleError(res, err); }
    else if(users.length > 0){
      return res.status(200).json({errorCode:1,message:"Mobile number is already in used"});
    }
    else {
          if(!req.body.email) 
            return res.status(200).json({errorCode:0,message:""});

          filter = {}
          if(req.body.userid)
            filter['_id'] = {$ne:req.body.userid}; 
          // if(req.body.email)
          filter['email'] = req.body.email;
          filter['deleted'] = false;
          User.find(filter,function(err,usrs){
             if(err){ return handleError(res, err); }
             else if(usrs.length > 0){
                return res.status(200).json({errorCode:2,message:"Email is already in used"});
             }
           else
          return res.status(200).json({errorCode:0,message:""});
        })
      
    }
  });
}*/

// Creates a new service in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  // var prQuote = validateProductQuote(req.body);
  req.body.createdAt = new Date();
  ManpowerUser.create(req.body, function(err, user) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(user);
  });
};

// Updates an existing user in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  ManpowerUser.findById(req.params.id, function (err, user) {
    if (err) { return handleError(res, err); }
    if(!user) { return res.status(404).send('Not Found'); }
    ManpowerUser.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Get products list
exports.getProducts = function(req, res) {
  var filter = {};
  //filter["status"] = true;
  filter["deleted"] = false;
  if(req.body.status)
    filter["status"] = req.body.status;
  if(req.body.searchStr){
    var term = new RegExp("^" + req.body.searchStr, 'i');
  filter['name'] = { $regex: term };
  }
  var query = Product.distinct("name", filter); 
  query.exec(
               function (err, products) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(products);
               }
  );
};

//search based on service type
exports.getSearchedUser = function(req, res) {
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  filter["isManpower"] = true;
  // if(req.body.role)
  //     filter["role"] = req.body.role;
  var arr = [];
  if(req.body.location){
    var locRegEx = req.body.location; // new RegExp(req.body.location, 'i');
    console.log("filter", locRegEx);
    arr[arr.length] = {"city":locRegEx};
    arr[arr.length] = {"state":locRegEx};
  }
  if(arr.length > 0)
    filter['$or'] = arr;

  if(req.body.searchStr){
    //var term = new RegExp("^" + req.body.searchStr, 'i');
    var term = req.body.searchStr;
   //filter['assetOperated'] = { $elemMatch : {$eq: { $regex: term }}};
   filter['assetOperated'] = { $elemMatch : {$eq: term }};
  }
  console.log("filter", filter);
  //var query = ManpowerUser.find(filter); 
  var query = User.find(filter); 
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