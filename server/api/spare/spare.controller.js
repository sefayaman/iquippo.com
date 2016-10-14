'use strict';

var _ = require('lodash');
var Seq = require('seq');
var trim = require('trim');
 var fs = require('fs');
 var gm = require('gm');
 var fsExtra = require('fs.extra');

var Spare = require('./spare.model');

var User = require('./../user/user.model');
var Group = require('./../group/group.model');
var Category = require('./../category/category.model');
var SubCategory = require('./../category/subcategory.model');
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');

//var PaymentTransaction = require('./../payment/payment.model');
//var appNotificationCtrl = require('./../appnotification/appnotification.controller');

var config = require('./../../config/environment');
var  xlsx = require('xlsx');
//var importPath = config.uploadPath + config.importDir +"/";

// Get list of products
exports.getAll = function(req, res) {
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  Spare.find(filter,function (err, spares) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(spares);
  });
};

// Get a single product
exports.getOnId = function(req, res) {
  Spare.findById(req.params.id, function (err, spare) {
    if(err) { return handleError(res, err); }
    if(!spare) { return res.status(404).send('Not Found'); }
    return res.json(spare);
  });
};

exports.statusWiseCount = function(req,res){
    var filter = {};
    filter['deleted'] = false;
    //filter['status'] = true;
    Spare.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$status', count: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(err);
      Spare.count({deleted:false},function(err,count){
        if(!err){
          var obj = {};
          obj._id = "total";
          obj.count = count;
          result.push(obj);
        }
        return res.status(200).json(result);
      });
    }
  );
}

//search spare
exports.searchSpare = function(req, res) {
  var term = new RegExp(req.body.sparename, 'i');
  var filter = {};
  filter["deleted"] = false;
  if(req.body.status)
    filter["status"] = req.body.status;
  var arr = [];
  if(req.body.sparename){
    var term = new RegExp(req.body.sparename, 'i');
    filter['name'] = { $regex: term };
  }

  if(req.body.location){
    var locRegEx = new RegExp(req.body.location, 'i');
    arr[arr.length] = {'locations.city':{$regex:locRegEx}};
    arr[arr.length] = {'locations.state':{$regex:locRegEx}};
  }

  if(req.body.category){
    var catRegEx = new RegExp(req.body.category, 'i');
    filter['spareDetails.category.name'] = {$regex:catRegEx};
  }

  if(req.body.cityName){
    var cityRegex = new RegExp(req.body.cityName, 'i');
    filter['locations.city'] = {$regex:cityRegex};
  }

  if(req.body.stateName){
    var stateRegex = new RegExp(req.body.stateName, 'i');
    filter['locations.state'] = {$regex:stateRegex};
  }
  if(req.body.partNo)
    filter["partNo"] = req.body.partNo;
  
  if(req.body.currency){
    var currencyFilter = {};
    if(req.body.currency.min){
      currencyFilter['$gte'] = req.body.currency.min;
    }
    if(req.body.currency.max){
      currencyFilter['$lte'] = req.body.currency.max;
    }
    
    filter["grossPrice"] = currencyFilter;
  }
  
  if(req.body.manufacturerId)
    filter["manufacturers._id"] = req.body.manufacturerId;

  if(req.body.manufacturer)
    filter["manufacturers.name"] = req.body.manufacturer;

  if(req.body.role && req.body.userid) {
    //var arr = [];
    arr[arr.length] = { "user._id": req.body.userid};
    arr[arr.length] = { "seller._id": req.body.userid};
    //filter['$or'] = arr; 
  } else if(req.body.userid) {
    filter["seller._id"] = req.body.userid;
  }

  if(arr.length > 0)
    filter['$or'] = arr;
  
  console.log("filter##", filter);
  var query = Spare.find(filter).sort( { createdAt: -1 } );
  query.exec(
               function (err, spares) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(spares);
               }
  );

};

// Updates an existing product in the DB.
exports.update = function(req, res) {
  req.isEdit = true;
  if(req.body.applyWaterMark){
      req.imgCounter = 0;
      req.totalImages = req.body.images.length;
       req.images = req.body.images;
       req.assetDir = req.body.assetDir;
       checkAndCopyImage(req,res,null);
  }else{
    updateSpare(req,res)    
  }

};

// Creates a new product in the DB.
exports.create = function(req, res) {
  req.isEdit = false;
  Spare.find({partNo:req.body.partNo},function(err, spare){
    if (err) { return handleError(res, err); }
    else if(spare.length > 0){
      return res.status(201).json({errorCode:1, message:"This part no already exist."});}
    else{
      if(req.body.applyWaterMark){
        req.imgCounter = 0;
        req.totalImages = req.body.images.length;
        req.images = req.body.images;
        req.assetDir = req.body.assetDir;
        checkAndCopyImage(req,res,null);
      }else{
        addSpare(req,res)    
      }
    } 
  });
};

function checkAndCopyImage(req,res,cb){
  
   if(req.imgCounter < req.totalImages){
      var imgObj = req.images[req.imgCounter];
      var imgPath = config.uploadPath + req.assetDir + "/" + imgObj.src;
      if(imgObj.waterMarked)
      {
        req.imgCounter ++;
        checkAndCopyImage(req,res,cb);
      }else{
        placeWatermark(req,res,imgPath,cb);
      }
   }else{
      if(cb)
        cb(req,res);
      else{
        if(req.isEdit)
          updateSpare(req,res);
        else {
          addSpare(req,res);  
        }
      }
   }
}

function placeWatermark(req,res,imgPath,cb){
      var waterMarkWidth = 144;
      var waterMarkHeight = 86;
      try{
        var imgRef = gm(imgPath);
        imgRef.size(function(err,val){
          if(err){
            return handleError(res, err);
          }
          var ptx = val.width - waterMarkWidth;
          var pty = val.height - waterMarkHeight;
          var args = 'image Over '+ ptx +','+ pty  +' 0,0 "' + config.uploadPath + '../images/watermark.png"';
          imgRef.draw([args])
          .write(imgPath, function(e){
            if(e){
              return handleError(res, err);
            }
            req.images[req.imgCounter].waterMarked = true;
            req.imgCounter ++;
            checkAndCopyImage(req,res,cb);
          });
        })
      }catch(e){
        console.log("exception------",e);
        return handleError(res, err);
      }
}

function updateSpare(req,res){
  var _id = req.body._id;
  if(req.body._id) { delete req.body._id; }
  if(req.body.userInfo) { delete req.body.userInfo; }
  //if(req.body.seller) { delete req.body.seller; }
  req.body.updatedAt = new Date();
  var filter = {}
  if(_id)
     filter['_id'] = {$ne:_id}; 
  if(req.body.partNo)
    filter['partNo'] = req.body.partNo;
  Spare.find(filter,function(err,spare){
    if(err) return handleError(res, err); 
    if(spare.length > 0){
      return res.status(200).json({errorCode:1, message:"Part no already exist."});
    } else {
        Spare.update({_id:req.params.id},{$set:req.body},function(err){
          if (err) { return handleError(res, err); }
          return res.status(200).json({errorCode:0, message:"Success"});
        });
    }
  });
  /*Spare.findById(req.params.id, function (err, spare) {
    if (err) { return handleError(res, err); }
    if(!spare) { return res.status(404).send('Not Found'); }
    Spare.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });*/
}

function addSpare(req,res){

  req.body.createdAt = new Date();
  req.body.relistingDate = new Date();
  req.body.updatedAt = new Date();
  Spare.create(req.body, function(err, spare) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(spare);
  });

}

// Deletes a spare from the DB.
exports.destroy = function(req, res) {
  Spare.findById(req.params.id, function (err, spare) {
    if(err) { return handleError(res, err); }
    if(!spare) { return res.status(404).send('Not Found'); }
    spare.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  console.log(err);
  return res.status(500).send(err);
}