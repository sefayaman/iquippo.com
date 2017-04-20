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
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');
var APIError = require('../../components/_error');
var uploadRequest = require('../common/uploadrequest/uploadrequest.controller');
var moment = require('moment');
var async = require('async');

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
  Spare.find(filter).sort({name:1}).exec(function (err, spares) {
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
        res.setHeader('Cache-Control', 'private, max-age=2592000');
        return res.status(200).json(result);
      });
    }
  );
}

//search spare
exports.searchSpare = function(req, res) {
  var term = new RegExp(req.body.sparename, 'i');
  var searchStrReg = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  filter["deleted"] = false;
  if(req.body.status) {
    //filter["status"] = req.body.status;
    var typeFilter = {};
    typeFilter['$in'] = ['active','sold'];
    filter["status"] = typeFilter;
  }

  if(req.body._id)
    filter["_id"] = req.body._id;
  
  var arr = [];
  if(req.body.sparename){
    var term = new RegExp(req.body.sparename, 'i');
    filter['name'] = { $regex: term };
  }
  var arr = [];
  if(req.body.searchstr){

    arr[arr.length] = { name: { $regex: searchStrReg }};
    arr[arr.length] = { "spareDetails.category.name": { $regex: searchStrReg }};
    arr[arr.length] = { "spareDetails.category.otherName": { $regex: searchStrReg }};
    arr[arr.length] = { city: { $regex: searchStrReg }};
    arr[arr.length] = { state: { $regex: searchStrReg }};
    arr[arr.length] = { country: { $regex: searchStrReg }};
    arr[arr.length] = { partNo: { $regex: searchStrReg }};
    arr[arr.length] = { "manufacturers.name": { $regex: searchStrReg }};
    arr[arr.length] = { "user.fname": { $regex: searchStrReg }};
    arr[arr.length] = { "user.lname": { $regex: searchStrReg }};
    arr[arr.length] = { status: { $regex: searchStrReg }};
  }

  if(req.body.location){
    var locRegEx = new RegExp(req.body.location, 'i');
    arr[arr.length] = {'locations.city':{$regex:locRegEx}};
    arr[arr.length] = {'locations.state':{$regex:locRegEx}};
    arr[arr.length] = {'locations.country':{$regex:locRegEx}};  
  }

  if(req.body.category){
    var catRegEx = new RegExp(req.body.category, 'i');
    arr[arr.length] = {'spareDetails.category.name':{$regex:catRegEx}};
    arr[arr.length] = {'spareDetails.category.otherName':{$regex:catRegEx}};
    //filter['spareDetails.category.name'] = {$regex:catRegEx};
  }

  if(req.body.cityName){
    var cityRegex = new RegExp(req.body.cityName, 'i');
    filter['locations.city'] = {$regex:cityRegex};
  }

  if(req.body.countryName){
    var countryRegex = new RegExp(req.body.countryName, 'i');
    filter['locations.country'] = {$regex:countryRegex};
  }

  if(req.body.stateName){
    var stateRegex = new RegExp(req.body.stateName, 'i');
    filter['locations.state'] = {$regex:stateRegex};
  }
  if(req.body.partNo)
    filter["partNo"] = {$regex:new RegExp(req.body.partNo,'i')};
  if(req.body.partNos && req.body.partNos.length > 0)
    filter["partNo"] = {$in:req.body.partNos};
  
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

  if(req.body.listingDate){
    var listingDate = false;
    var dateFilter = {};
    if(req.body.listingDate.fromDate){
      dateFilter['$gte'] = req.body.listingDate.fromDate;
      listingDate = true;
    }
    if(req.body.listingDate.toDate){
      dateFilter['$lte'] = req.body.listingDate.toDate + 1;
      listingDate = true;
    }
    if(listingDate)
      filter["createdAt"] = dateFilter;
 }
  
  if(req.body.manufacturerId)
    filter["manufacturers._id"] = req.body.manufacturerId;

  if(req.body.manufacturer) {
    var manufacturerRegex = new RegExp(req.body.manufacturer, 'i');
    filter["manufacturers.name"] = {$regex:manufacturerRegex};
  }

  if(req.body.status)
    filter["status"] = req.body.status;

  if(req.body.listedBy){
    var nameRegex = new RegExp(req.body.listedBy, 'i');
    //filter['user.fname'] = {$regex:listedByRegex};
    arr[arr.length] = {'user.fname':{$regex:nameRegex}};
    arr[arr.length] = {'user.lname':{$regex:nameRegex}};
  }

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
  
  var result = {};
  if(req.body.pagination){
    paginatedSpares(req,res,filter,result);
    return;    
  }
  // var maxItem = 600;
  // if(req.body.maxItem)
  //   maxItem = req.body.maxItem;

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Spare.find(filter).sort(sortObj);
  Seq()
  .par(function(){
    var self = this;
    Spare.count(filter,function(err, counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){
    var self = this;
    query.exec(function (err, spares) {
        if(err) { return handleError(res, err); }
        result.spares = spares;
        self();
       }
    );

  })
  .seq(function(){
    return res.status(200).json(result.spares);
  })

};

function paginatedSpares(req,res,filter,result){
  var pageSize = req.body.itemsPerPage;
  var first_id = req.body.first_id;
  var last_id = req.body.last_id;
  var currentPage = req.body.currentPage;
  var prevPage = req.body.prevPage;
  var isNext = currentPage - prevPage >= 0?true:false;
  Seq()
  .par(function(){
    var self = this;
    Spare.count(filter,function(err,counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){

      var self = this;
      var sortFilter = {_id : -1};
      if(last_id && isNext){
        filter['_id'] = {'$lt' : last_id};
      }
      if(first_id && !isNext){
        filter['_id'] = {'$gt' : first_id};
        sortFilter['_id'] = 1;
      }

      var query = null;
      var skipNumber = currentPage - prevPage;
      if(skipNumber < 0)
        skipNumber = -1*skipNumber;

      query = Spare.find(filter).sort(sortFilter).limit(pageSize*skipNumber);
      query.exec(function(err,spares){
          if(!err && spares.length > pageSize*(skipNumber - 1)){
                result.spares = spares.slice(pageSize*(skipNumber - 1),spares.length);
          }else
            result.spares = [];
          if(!isNext && result.spares.length > 0)
           result.spares.reverse();
           self(err);
    });
  })
  .seq(function(){
      return res.status(200).json(result);
  })
  .catch(function(err){
    handleError(res,err);
  }) 
}

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

exports.exportXLSX = function(req,res,next){
  var query = null;
  //var options = req.query || {};
  var filters = {};
  var sort = {
    '_id': -1
  };
 
  query = Spare.find(filters);
  query = query.sort(sort);
  query.exec(fetchData);

  function fetchData(err,results){
    if(err || !results)
      return next(err || new APIError(500,'Error while fethcing records...Please try after some time...'));

    var xlsxData = [];
    var json = {};
    var arr =[];
    var headers = ['Part No','Part Name','Manufacturer','Categories','Listed By','Listed Date','Price (₹)'];

    results.forEach(function(x){
      json = {};
      arr = [];
      arr.push(
          _.get(x,'partNo',''),
          _.get(x,'name',''),
          _.get(x,'manufacturers.name',''),
          _.get(x,'spareDetails[0].category.name',''),
          _.get(x,'seller.fname','') + ' ' + _.get(x,'seller.lname',''),
          moment(_.get(x,'spareStatuses[0].createdAt','')).format('MM/DD/YYYY'),
          _.get(x,'grossPrice','')
        );

      for(var i = 0; i< headers.length;i++){
        json[headers[i]] = arr[i];
      }

      xlsxData.push(json);
    })

    res.xls('sparelist.xlsx', xlsxData);
  }
}

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
  filter['delete'] = false;

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

function _create(data,cb){
  data.createdAt = new Date();
  data.relistingDate = new Date();
  data.updatedAt = new Date();
  Spare.create(data, function(err, spare) {
    if(err) { cb(err) }
    return cb();
  });
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


exports.uploadExcel = function(req,res){
  var data = {
    uploadData : req.body,
    type : 'spareUpload'
  }
  uploadRequest.create(data, function(err, result) {
    if (err)
      return res.sendStatus(500).send(err);
    return res.json(result);
  });
}

function handleError(res, err) {
  console.log(err);
  return res.status(500).send(err);
}

exports.bulkCreate = function(data, cb) {
  var errObj = [],
    sucessObj = [];

  // data = data.filter(function(x) {
  //   var err = validateData(x);
  //   if (err) {
  //     errObj.push({
  //       data: x,
  //       error: err
  //     });
  //   } else
  //     return x;
  // });

  if (data.length) {
    //AA:If the length of data is non zero
    //insert data asynchronously in mongodb
    async.eachLimit(data, 5, iteration, finalize);
  }else{
    console.log('No data for create');
    return {
      errObj :errObj,
      sucessObj : sucessObj
    }
  }

  function iteration(spareData, next) {
    _create(spareData,function(response){
    // AuctionRequest.create(auctionData, function(err, auction) {
      if (response instanceof Error) {
        errObj.push({
          data: spareData,
          error: response
        })
      } else {
        sucessObj.push(spareData);
      }

      return next();
    });
  }

  function finalize(err) {
    if (err)
      console.log(err);

    if (errObj.length && !sucessObj.length)
      return cb({
        Error: 'Error while inserting these data:' + errObj.toString(),
        errObj: errObj
      });

    if (sucessObj.length && !errObj.length)
      return cb(null, {
        Error: '',
        sucessObj: sucessObj
      });

    if (errObj.length && sucessObj.length)
      return cb({
        Error: 'Error while inserting these data:' + errObj.toString() +
          'Inserted Successfully:' + sucessObj.toString(),
        sucessObj: sucessObj,
        errObj: errObj
      });
  }

}