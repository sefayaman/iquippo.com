'use strict';

var _ = require('lodash');
var Seq = require('seq');
var trim = require('trim');
 var fs = require('fs');
 var gm = require('gm');
 var fsExtra = require('fs.extra');

var Product = require('./product.model');
var ProductHistory = require('./producthistory.model');

var User = require('./../user/user.model');
var Group = require('./../group/group.model');
var Category = require('./../category/category.model');
var SubCategory = require('./../category/subcategory.model');
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');

var PaymentTransaction = require('./../payment/payment.model');
var ValuationReq = require('./../valuation/valuation.model');
var AuctionReq = require('./../auction/auction.model');

var appNotificationCtrl = require('./../appnotification/appnotification.controller');

var config = require('./../../config/environment');
var IncomingProduct = require('./../../components/incomingproduct.model');
var  xlsx = require('xlsx');
var importPath = config.uploadPath + config.importDir +"/";
var async = require('async');
var debug = require('debug')('api.product.controller');
var productFieldsMap = require('./../../config/product_temp_field_map');
var productInfoModel = require('../productinfo/productinfo.model');
var async = require('async');



// Get list of products
exports.getAll = function(req, res) {
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  Product.find(filter,function (err, products) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(products);
  });
};

// Get a single product
exports.getOnId = function(req, res) {
  Product.findById(req.params.id, function (err, product) {
    if(err) { return handleError(res, err); }
    if(!product) { return res.status(404).send('Not Found'); }
    return res.json(product);
  });
};
//incoming products

exports.incomingProduct = function(req,res){
   IncomingProduct.find({'user._id':req.body.userId}, function (err, products) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(products);
  });
}

exports.deleteIncomingProduct = function(req,res){
  IncomingProduct.findOneAndRemove({_id:req.body.productId},function(err,dt){
    if(err) { return handleError(res, err); }
    if(!dt){ res.status(404).json({errorCode:1});}
    else
      res.status(200).json({});
  })
}

exports.getIncomingProduct = function(req,res){
  IncomingProduct.findOneAndUpdate({_id:req.body.productId,lock:false},{$set:{lock:true}},function(err,dt){
    if(err) { return handleError(res, err); }
    if(!dt){return res.status(404).json({errorCode:1});}
    return res.status(200).json(dt);
  })
}

exports.unIncomingProduct = function(req,res){
  IncomingProduct.update({_id:req.body.productId},{$set:{lock:false}},function(err,dt){
    if(err) { return handleError(res, err); }
    return res.status(200).json(dt);
  })
}

//search products
exports.search = function(req, res) {
  var term = new RegExp(req.body.searchstr, 'i');
  
  var filter = {};
  //filter["status"] = true;
  filter["deleted"] = false;
  if(req.body.status)
    filter["status"] = req.body.status;

  if(req.body.statusText == "active")
    filter["status"] = true;
  if(req.body.statusText == "inactive")
    filter["status"] = false;

  if(req.body.featured)
    filter["featured"] = req.body.featured;
  var arr = [];
  if(req.body.searchstr){

    arr[arr.length] = { name: { $regex: term }};
    arr[arr.length] = { "group.name": { $regex: term }};
    arr[arr.length] = { "group.otherName": { $regex: term }};
    arr[arr.length] = { "category.name": { $regex: term }};
    arr[arr.length] = { "category.otherName": { $regex: term }};
    arr[arr.length] = { "model.name": { $regex: term }};
    arr[arr.length] = { "model.otherName": { $regex: term }};
    arr[arr.length] = { "brand.name": { $regex: term }};
    arr[arr.length] = { "brand.otherName": { $regex: term }};
    arr[arr.length] = { city: { $regex: term }};
    arr[arr.length] = { state: { $regex: term }};
    arr[arr.length] = { assetStatus: { $regex: term }};
    arr[arr.length] = { tradeType: { $regex: term }};
    arr[arr.length] = { assetId: { $regex: term }};
    //arr[arr.length] = { grossPrice: { $regex: term }};
    arr[arr.length] = { "seller.fname": { $regex: term }};
    arr[arr.length] = { mfgYear: { $regex: term }};
  }

  if(req.body.groupStr){
    var gpRegex = new RegExp(req.body.groupStr, 'i');
    arr[arr.length] = { "group.name": { $regex: gpRegex}};
    arr[arr.length] = { "group.otherName": { $regex: gpRegex}};
  }

  if(req.body.categoryStr){
    var ctRegex = new RegExp(req.body.categoryStr, 'i');
    arr[arr.length] = { "category.name": { $regex: ctRegex }};
    arr[arr.length] = { "category.otherName": { $regex: ctRegex }};
  }

  if(req.body.brandStr){
    var brRegex = new RegExp(req.body.brandStr, 'i');
    arr[arr.length] = { "brand.name": { $regex: brRegex}};
    arr[arr.length] = { "brand.otherName": { $regex: brRegex}};
   
  }

  if(req.body.modelStr){
    var mdRegex = new RegExp(req.body.modelStr, 'i');
    arr[arr.length] = { "model.name": { $regex: mdRegex }};
    arr[arr.length] = { "model.otherName": { $regex: mdRegex }};
  }

  if(req.body.sellerName)
   filter["seller.fname"] = {$regex:new RegExp(req.body.sellerName,'i')};

  if(req.body.location){
    var locRegEx = new RegExp(req.body.location, 'i');
    arr[arr.length] = {city:{$regex:locRegEx}};
    arr[arr.length] = {state:{$regex:locRegEx}};
  }

  if(req.body.cityName){
    var cityRegex = new RegExp(req.body.cityName, 'i');
    filter['city'] = {$regex:cityRegex};
  }

  if(req.body.stateName){
    var stateRegex = new RegExp(req.body.stateName, 'i');
    filter['state'] = {$regex:stateRegex};
  }
  
  if(req.body.tradeType){
   filter["tradeType"] = {$in:[req.body.tradeType,'BOTH']};
  }
  if(req.body.tradeValue)
   filter["tradeType"] = {$regex:new RegExp(req.body.tradeValue,'i')}; 
  if(req.body.assetStatus)
    filter["assetStatus"] = {$regex:new RegExp(req.body.assetStatus,'i')};
  if(req.body.assetId)
    filter["assetId"] = {$regex:new RegExp(req.body.assetId,'i')};
   if(req.body.assetIds && req.body.assetIds.length > 0)
    filter["assetId"] = {$in:req.body.assetIds};
  if(req.body.group)
    filter["group.name"] = req.body.group;
  if(req.body.category)
    filter["category.name"] = req.body.category;
  if(req.body.subCategory)
    filter["subcategory.name"] = req.body.subCategory;
  if(req.body.brand)
    filter["brand.name"] = req.body.brand;
  if(req.body.model)
    filter["model.name"] = req.body.model;
   if(req.body.operatingHour)
    filter["operatingHour"] = req.body.operatingHour;
   if(req.body.mileage)
    filter["mileage"] = req.body.mileage;
  if(req.body.country)
    filter["country"] = req.body.country;
   var currencyFilter = {};
   var isCFilter = false;
  if(req.body.currency && req.body.currency.type){
    if(req.body.currency.min){
      currencyFilter['$gte'] = req.body.currency.min;
      isCFilter = true;
    }
    if(req.body.currency.max){
      currencyFilter['$lte'] = req.body.currency.max;
      isCFilter = true;
    }
  }
  if(isCFilter){
    filter["currencyType"] = req.body.currency.type;
    filter["grossPrice"] = currencyFilter;
  }

 if(req.body.mfgYear){
    var mfgYear = false;
    var mfgFilter = {};
    if(req.body.mfgYear.min){
      mfgFilter['$gte'] = req.body.mfgYear.min;
      mfgYear = true;
    }
    if(req.body.mfgYear.max){
      mfgFilter['$lte'] = req.body.mfgYear.max;
      mfgYear = true;
    }
    if(mfgYear)
      filter["mfgYear"] = mfgFilter;
 }

  if(req.body.categoryId)
    filter["category._id"] = req.body.categoryId;

  if(req.body.role && req.body.userid) {
    arr[arr.length] = { "user._id": req.body.userid};
    arr[arr.length] = { "seller._id": req.body.userid}; 
      
    if(req.body.role === "channelpartner"){
      fetchUsers(req.body.userid,function(data){
        var usersArr = []; 
        if(data && data.length){
          data.forEach(function(x){
            usersArr.push(x._id.toString());
          })
        } 
        if(usersArr.length){
          usersArr = usersArr.concat(req.body.userid);
            arr[arr.length-1] = { "seller._id": {"$in":usersArr}}; 
        }
        fetchResults();
      }) 
    }
  } else if(req.body.userid) {
    filter["seller._id"] = req.body.userid;
    fetchResults();
  } else {
    fetchResults();
  }
 
  function fetchResults(){
    if(arr.length > 0)
      filter['$or'] = arr;
    var result = {};
    if(req.body.pagination){
      paginatedProducts(req,res,filter,result);
      return;    
    }
    var maxItem = 600;
    if(req.body.maxItem)
      maxItem = req.body.maxItem;

    var sortObj = {}; 
    if(req.body.sort)
      sortObj = req.body.sort;
    sortObj['createdAt'] = -1;

    var query = Product.find(filter).sort(sortObj).limit(maxItem);
    Seq()
    .par(function(){
      var self = this;
      Product.count(filter,function(err,counts){
        result.totalItems = counts;
        self(err);
      })
    })
    .par(function(){
      var self = this;
      query.exec(function (err, products) {
          if(err) { return handleError(res, err); }
          result.products = products;
          self();
         }
      );

    })
    .seq(function(){
      return res.status(200).json(result.products);
    })
  }
  

};


function paginatedProducts(req,res,filter,result){

  var pageSize = req.body.itemsPerPage;
  var first_id = req.body.first_id;
  var last_id = req.body.last_id;
  var currentPage = req.body.currentPage;
  var prevPage = req.body.prevPage;
  var isNext = currentPage - prevPage >= 0?true:false;
  Seq()
  .par(function(){
    var self = this;
    Product.count(filter,function(err,counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){

      var self = this;
      var sortFilter = {_id : -1};
      if(last_id && isNext){
        filter['_id'] = {'$lt' : last_id};
        console.log("going forward");
      }
      if(first_id && !isNext){
        filter['_id'] = {'$gt' : first_id};
        sortFilter['_id'] = 1;
        console.log("going backward");
      }

      var query = null;
      var skipNumber = currentPage - prevPage;
      if(skipNumber < 0)
        skipNumber = -1*skipNumber;

      query = Product.find(filter).sort(sortFilter).limit(pageSize*skipNumber);
      query.exec(function(err,products){
          if(!err && products.length > pageSize*(skipNumber - 1)){
                result.products = products.slice(pageSize*(skipNumber - 1),products.length);
          }else
            result.products = [];
          if(!isNext && result.products.length > 0)
           result.products.reverse();
           self(err);
    });

  })
  .seq(function(){
      return res.status(200).json(result);
  })
  .catch(function(err){
    console.log("######",err);
    handleError(res,err);
  })
 
}


//bulk product update
exports.bulkUpdate = function(req,res){
  var bodyData = req.body;
  var dataToSet = {};
  dataToSet.updatedAt = new Date();
  switch(bodyData.action){
    case 'delete':
      dataToSet.deleted = true;
    case 'deactive':
        dataToSet.status = false;
        //dataToSet.featured = false;
         Product.update({_id : {"$in":bodyData.selectedIds}}, {$set:dataToSet}, {multi: true} , function(err, product) {
            if(err) { 
              return handleError(res, err); 
            }
            return res.status(200).json({});
          });
      break;
      case 'priceonrequest':
         dataToSet.priceOnRequest = true;
          Product.update({_id : {"$in":bodyData.selectedIds},tradeType:{$ne:'RENT'}}, {$set:dataToSet}, {multi: true} , function(err, product) {
            if(err) { 
              return handleError(res, err); 
            }
            return res.status(200).json({});
          });
      break;
      case 'active':
       req.prdCounter = 0;
       req.totalPrd = bodyData.selectedIds.length;
       bulkActive(req,res);
       break;
       default:
         return res.status(404).send('Not Found');
  }
}

function bulkActive(req,res){
  if(req.prdCounter < req.totalPrd){
    var id = req.body.selectedIds[req.prdCounter];
    Product.findById(id,function(err,product){
      if(err){return handleError(res, err)}
      else{
          req.imgCounter = 0;
          req.totalImages = product.images.length;
          req.images = product.images;
          req.assetDir = product.assetDir;
          req.product = product;
          checkAndCopyImage(req,res,singleProductActive);
        //singleProductUpload(req,res,prdoduct);
      }

    })
  }else{
    return res.status(200).json({});
  }
}

function singleProductActive(req,res){
   var product = req.product;
   var productId = product._id;
   if(product._id) { delete product._id; }
   product.status = true;
   Product.update({_id:productId},{$set:product},function(err){
      if (err) { return handleError(res, err); }
        req.prdCounter ++;
        bulkActive(req,res);
        //return res.status(200).json(req.body);
  });
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
    updateProduct(req,res)    
  }

};

// Creates a new product in the DB.
exports.create = function(req, res) {
  req.isEdit = false;
  Product.find({assetId:req.body.assetId},function(err,pds){
    if (err) { return handleError(res, err); }
    else if(pds.length > 0){return res.status(404).json({errorCode:1});}
    else{
      if(req.body.applyWaterMark){
        req.imgCounter = 0;
        req.totalImages = req.body.images.length;
        req.images = req.body.images;
        req.assetDir = req.body.assetDir;
        checkAndCopyImage(req,res,null);
      }else{
        addProduct(req,res)    
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
       /* var fileNameParts = imgObj.src.split('.');
        var extPart = fileNameParts[fileNameParts.length -1];
        var namePart = fileNameParts[0];
        var originalFilePath = config.uploadPath + req.assetDir + "/" + namePart +"_original." + extPart;
        if(fileExists(originalFilePath)){
            placeWatermark(req,res,imgPath,cb);
        }else{
            fsExtra.copy(imgPath,originalFilePath,function(err,result){
              placeWatermark(req,res,imgPath,cb);
            })
        }*/
      }
   }else{
      if(cb)
        cb(req,res);
      else{
        if(req.isEdit)
          updateProduct(req,res);
        else
          addProduct(req,res);  
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
            req.images[req.imgCounter].waterMarked = false;
            req.imgCounter ++;
            checkAndCopyImage(req,res,cb);
            return;
            //return handleError(res, err);
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
         req.images[req.imgCounter].waterMarked = false;
          req.imgCounter ++;
          checkAndCopyImage(req,res,cb);
          return;
        //return handleError(res, err);
      }
}

function updateProduct(req,res){
  if(req.body._id) { delete req.body._id; }
  if(req.body.userInfo) { delete req.body.userInfo; }
  //if(req.body.seller) { delete req.body.seller; }
  req.body.updatedAt = new Date();
  Product.findById(req.params.id, function (err, product) {
    if (err) { return handleError(res, err); }
    if(!product) { return res.status(404).send('Not Found'); }
    Product.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
}

function addProduct(req,res){

  req.body.createdAt = new Date();
  req.body.relistingDate = new Date();
  req.body.updatedAt = new Date();
  Product.create(req.body, function(err, product) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(product);
  });

}

// Updates an existing expiry product in the DB.
exports.setExpiry = function(req, res) {
   var ids = req.body;
  var obj = {};
  obj['updatedAt'] = new Date();
  obj['status'] = false;
  obj['featured'] = false;
  obj['expired'] = true;
  console.log("setExpiry:::", req.body.ids);
  Product.update({_id : {"$in":ids}}, {$set:obj}, {multi: true} , function(err, product) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(product);
  });
  
};

exports.updateInquiryCounter = function(req,res){
  var ids = req.body;
  Product.update({_id:{$in:ids}},{$inc:{inquiryCounter:1}},{multi:true},function(err,data){
    res.status(200).send('');
  });
}
// Deletes a product from the DB.
exports.destroy = function(req, res) {
  Product.findById(req.params.id, function (err, product) {
    if(err) { return handleError(res, err); }
    if(!product) { return res.status(404).send('Not Found'); }
    product.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.countryWiseProductCount = function(req,res){
    Product.aggregate(
    { $match: {
            status: true,
            deleted: false
        }},
    { $group: 
      { _id: '$country', total_products: { $sum: 1 } } 
    },
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}
exports.categoryWiseCount = function(req,res){
    var filter = {};
    filter['deleted'] = false;
    filter['status'] = true;
    if(req.body.categoryIds)
      filter['category._id'] = {$in:req.body.categoryIds};
    Product.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$category._id', count: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}

exports.statusWiseCount = function(req,res){
    var filter = {};
    filter['deleted'] = false;
    filter['status'] = true;
    Product.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$assetStatus', count: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(err);
      Product.count({deleted:false},function(err,count){
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

exports.userWiseProductCount = function(req,res){
  var filter = {};
  filter['deleted'] = false;
  if(req.body.userId)
    filter["seller._id"] = req.body.userId;
  Product.aggregate(
    { $match: filter },
    { $group: 
      { _id: '$assetStatus', total_assetStatus: { $sum: 1 } } 
    },
    function (err, result) {
      if (err) return handleError(err);
      filter['assetStatus'] = 'listed';
       Product.aggregate(
        { $match: filter },
        { $group: 
          { _id: '$tradeType', total_tradeType: { $sum: 1 } } 
        },
        function (err, data) {
          if (err) return handleError(err);
          //console.log(data);
          result = result.concat(data);
          //return res.status(200).json(result);
          delete filter.assetStatus;
           Product.aggregate(
            { $match: filter },
            { $group: 
              { _id: 'inquiryCount', inquiryCount: { $sum: '$inquiryCounter' } } 
            },
            function (err, inCount) {
              if (err) return handleError(err);
              console.log(data);
              result = result.concat(inCount);
              return res.status(200).json(result);
            }
          );
        }
      );
    }
  );
}

// Creates a new product History in the DB.
exports.createHistory = function(req, res) {
  req.body.createdAt = new Date();
  req.body.relistingDate = new Date();
  req.body.updatedAt = new Date();
  ProductHistory.create(req.body, function(err, product) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(product);
  });
};

//search based on productId
exports.getHistory = function(req, res) {
  //var term = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  filter["history.deleted"] = false;
 if(req.body.productId)
    filter["history.productId"] = req.body.productId;

  var query = ProductHistory.find(filter);
  query.exec(
               function (err, product) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(product);
               }
  );
};


function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}



function datenum(v, date1904) {
  if(date1904) v+=1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
 
function setType(cell){
  if(typeof cell.v === 'number')
    cell.t = 'n';
  else if(typeof cell.v === 'boolean')
      cell.t = 'b';
  else if(cell.v instanceof Date)
   {
        cell.t = 'n'; cell.z = xlsx.SSF._table[14];
        cell.v = datenum(cell.v);
    }
    else cell.t = 's';
}

function excel_from_data(data, isAdmin) {
  var ws = {};
  var range;
  if(isAdmin)
    range = {s: {c:0, r:0}, e: {c:41, r:data.length }};
  else
    range = {s: {c:0, r:0}, e: {c:26, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    var C = 0;
    var product = null;
    if(R != 0)
      product = data[R-1];
    var cell = null;
    if(R == 0)
      cell = {v: "Product Id"};
    else{
      if(product)
        cell =  {v: product.productId};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R != 0)
      product = data[R-1];
    var cell = null;
    if(R == 0)
      cell = {v: "Asset Id"};
    else{
      if(product)
        cell =  {v: product.assetId};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R != 0)
      product = data[R-1];
    var cell = null;
    if(R == 0)
      cell = {v: "Trading Type"};
    else{
      if(product)
        cell =  {v: product.tradeType};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Listing date"};
    else {
      if(product)
        cell = {v: product.createdAt};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;
///////////
    var createdBy = "";
    var userRole = "";
    if(product && product.user && product.user.fname) {
      if(product.user.role == 'admin')
        userRole = "Admin";
      else if(product.user.role == 'channelpartner')
        userRole = "Channel Partner";
      else if(product.user.role == 'customer')
        userRole = "Self";
      createdBy = product.user.fname + '('+ userRole +')' ;
    }
    else
      createdBy = "";
    if(R == 0)
      cell = {v: "Uploaded By"};
    else
      cell = {v: createdBy};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var sellerName = "";
    if(product && product.seller && product.seller.fname) 
      sellerName = product.seller.fname + " " + product.seller.lname;
    else
      sellerName = "";
    if(R == 0)
      cell = {v: "Seller name"};
    else
      cell = {v: sellerName};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var sellerPhone = "";
    if(product && product.seller && product.seller.phone) 
      sellerPhone = product.seller.phone;
    else
      sellerPhone = "";
    if(R == 0)
      cell = {v: "Seller contact"};
    else
      cell = {v: sellerPhone};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Seller Country"};
    else {
      if(product && product.seller)
        cell = {v: product.seller.country};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Seller number"};
    else {
      if(product && product.seller)
        cell = {v: product.seller.mobile};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var sellerEmail = "";
      if(product && product.seller && product.seller.email)
        sellerEmail = product.seller.email;
      else
        sellerEmail = "";
    if(R == 0)
      cell = {v: "Seller email"};
    else 
      cell = {v: sellerEmail};
    
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var productName = "";
    if(product && product.name) 
      productName = product.name;
    else
      productName = "";
    if(R == 0)
      cell = {v: "Product Name"};
    else
      cell = {v: productName};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var state = "";
    if(product && product.state) 
      state = product.state;
    else
      state = "";
    if(R == 0)
      cell = {v: "State"};
    else
      cell = {v: state};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var location = "";
    if(product && product.city) 
      location = product.city;
    else
      location = "";
    if(R == 0)
      cell = {v: "Location"};
    else
      cell = {v: location};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;


    var productGroup = "";
    if(product && product.group && product.group.name) 
      productGroup = product.group.name;
    else
      productGroup = "";
    if(R == 0)
      cell = {v: "Group"};
    else
      cell = {v: productGroup};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Category"};
    else {
      if(product && product.category)
        cell = {v: product.category.name};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Brand"};
    else {
      if(product && product.brand)
        cell = {v: product.brand.name};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;


    if(R == 0)
      cell = {v: "Model"};
    else {
      if(product && product.model)
        cell = {v: product.model.name};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Manufacturing Year"};
    else {
      if(product)
        cell = {v: product.mfgYear};
    }
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    var operatingHour = "";
    if(product && product.operatingHour) 
      operatingHour = product.operatingHour;
    else
      operatingHour = "";
    if(R == 0)
      cell = {v: "Motor Hrs"};
    else
      cell = {v: operatingHour};
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    var mileage = "";
    if(product && product.mileage) 
      mileage = product.mileage;
    else
      mileage = "";
    if(R == 0)
      cell = {v: "Mileage"};
    else
      cell = {v: mileage};
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    var grossPrice = "";
    if(product && product.grossPrice) 
      grossPrice = product.grossPrice;
    else
      grossPrice = "";
    if(R == 0)
      cell = {v: "Listed Price"};
    else
      cell = {v: grossPrice};
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    var serialNo = "";
    if(product && product.grossPrice) 
      serialNo = product.serialNo;
    else
      serialNo = "";
    if(R == 0)
      cell = {v: "Machine Sr no"};
    else
      cell = {v: serialNo};
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Expired (Y/N)"};
    else {
      if(product)
        cell = {v: isYorN(product.expired)};
    }
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Relisting date"};
    else {
      if(product)
        cell = {v: product.relistingDate};
    }
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Asset Status"};
    else {
      if(product)
        cell = {v: product.assetStatus};
    }
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "Status"};
    else {
      if(product){
        if(product.status)
          cell = {v: "Active"};
        else
          cell = {v: "Inactive"};
      }
    }
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    setType(cell);
    ws[cell_ref] = cell;

  if(isAdmin) {
      var saleDate;
      if(product && product.sellInfo && product.sellInfo.saleDate)
        saleDate = product.sellInfo.saleDate;
      else
        saleDate = '';
      if(R == 0)
        cell = {v: "Sale date"};
      else
        cell = {v: saleDate};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var alternateMobile;
      if(product && product.alternateMobile)
        alternateMobile = product.alternateMobile;
      else
        alternateMobile = '';
      if(R == 0)
        cell = {v: "Alternate Mobile"};
      else
        cell = {v: alternateMobile};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var salePrice = '';
      if(product && product.sellInfo && product.sellInfo.salePrice)
        salePrice = product.sellInfo.salePrice;
      else
        salePrice = '';
      if(R == 0)
        cell = {v: "Sale price"};
      else
        cell  = {v: salePrice};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var saleCommission = '';
      if(product && product.sellInfo && product.sellInfo.saleCommission)
        saleCommission = product.sellInfo.saleCommission;
      else
        saleCommission = '';
      if(R == 0)
        cell = {v: "Sale comission"};
      else
        cell = {v: saleCommission};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var buyerName = "";
      if(product && product.sellInfo && product.sellInfo.buyerName)
        buyerName = product.sellInfo.buyerName;
      else
        buyerName = "";
      if(R == 0)
        cell = {v: "Buyer name"};
      else
        cell = {v: buyerName};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var country = "";
      if(product && product.sellInfo && product.sellInfo.country)
        country = product.sellInfo.country;
      else
        country = "";
      if(R == 0)
        cell = {v: "Buyer Country"};
      else
        cell = {v: country};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var buyerCity = "";
      if(product && product.sellInfo && product.sellInfo.buyerCity)
        buyerCity = product.sellInfo.buyerCity;
      else
        buyerCity = "";
      if(R == 0)
        cell = {v: "Buyer City"};
      else
        cell = {v: buyerCity};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var buyerMobile = "";
      if(product && product.sellInfo && product.sellInfo.buyerMobile)
        buyerMobile = product.sellInfo.buyerMobile;
      else
        buyerMobile = "";
      if(R == 0)
        cell = {v: "Buyer number"};
      else
        cell = {v: buyerMobile};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var buyerEmail = "";
      if(product && product.sellInfo && product.sellInfo.buyerEmail)
        buyerEmail = product.sellInfo.buyerEmail;
      else
        buyerEmail = "";
      if(R == 0)
        cell = {v: "Buyer email"};
      else
        cell = {v: buyerEmail};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var isPastShipping = "";
      if(product && product.sellInfo 
        && product.sellInfo.shippingQuote 
        && product.sellInfo.shippingQuote.isPastShipping == "yes")
        isPastShipping = "Y, " + product.sellInfo.shippingQuote.detail;
      else
        isPastShipping = "N";
      if(R == 0)
        cell = {v: "Shipping availed (Y/N)"};
      else
        cell = {v: isPastShipping};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var shippingServiceDate;
      if(product && product.sellInfo 
        && product.sellInfo.shippingQuote 
        && product.sellInfo.shippingQuote.serviceDate)
        shippingServiceDate = product.sellInfo.shippingQuote.serviceDate;
      else
        shippingServiceDate = '';
      if(R == 0)
        cell = {v: "Shipping Date"};
      else
        cell = {v: shippingServiceDate};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var isPastValuation = "";
      if(product && product.sellInfo 
        && product.sellInfo.valuationQuote 
        && product.sellInfo.valuationQuote.isPastValuation == "yes")
        isPastValuation = "Y, " + product.sellInfo.valuationQuote.detail;
      else
        isPastValuation = "N";
      if(R == 0)
        cell = {v: "Valuation Aviled (Y/N)"};
      else
        cell = {v: isPastValuation};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var valuationServiceDate;
      if(product && product.sellInfo 
        && product.sellInfo.valuationQuote 
        && product.sellInfo.valuationQuote.serviceDate)
        valuationServiceDate = product.sellInfo.valuationQuote.serviceDate;
      else
        valuationServiceDate = '';
      if(R == 0)
        cell = {v: "Valuation Date"};
      else
        cell = {v: valuationServiceDate};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var isCertifiedByIQuippo = "";
      if(product && product.sellInfo 
        && product.sellInfo.certifiedByIQuippoQuote 
        && product.sellInfo.certifiedByIQuippoQuote.isCertifiedByIQuippo == "yes")
        isCertifiedByIQuippo = "Y, " + product.sellInfo.certifiedByIQuippoQuote.detail;
      else
        isCertifiedByIQuippo = "N";
      if(R == 0)
        cell = {v: "Certified by iQuippo availed (Y/N)"};
      else
        cell = {v: isCertifiedByIQuippo};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;

      var certifiedServiceDate;
      if(product && product.sellInfo 
        && product.sellInfo.certifiedByIQuippoQuote 
        && product.sellInfo.certifiedByIQuippoQuote.serviceDate)
        certifiedServiceDate = product.sellInfo.certifiedByIQuippoQuote.serviceDate;
      else
        certifiedServiceDate = '';
      if(R == 0)
        cell = {v: "Certified by iQuippo Date"};
      else
        cell = {v: certifiedServiceDate};
      var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
      setType(cell);
      ws[cell_ref] = cell;
    }
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

function isYorN(status) {
if(status)
  return "Y";
else
  return "N";
}

function fetchUsers(id,cb){
  User.find({'createdBy._id' : id},function(err,results){
    if(err){
      console.log(err);
      return cb();
    }
    return cb(results);
  })
}

//export data into excel
exports.exportProducts = function(req,res){
  var filter = {};
  //filter["status"] = true;
  filter["deleted"] = false;
  var isAdmin = true;
  if(req.body.userid){
    if(req.body.role == "channelpartner"){
      filter['$or'] = [{
        "user._id" : req.body.userid
      },{
        "seller._id" : req.body.userid
      }];

      fetchUsers(req.body.userid,function(data){
        var usersArr = []; 
        if(data && data.length){
          data.forEach(function(x){
            usersArr.push(x._id.toString());
          })
        } 
        if(usersArr.length){
          usersArr = usersArr.concat(req.body.userid);
          filter["$or"][1]["seller._id"] = {
            "$in" : usersArr
          }
        }
        fetchResults();
      }) 
    }
    else{
      filter["seller._id"] = req.body.userid;
      fetchResults();
    }
    isAdmin = false;
  } else {
    fetchResults();
  }


  
  function fetchResults(){
    var query = Product.find(filter).sort({productId:1});
    query.exec(
      function (err, products) {
        if(err) { return handleError(res, err); }
        var ws_name = "products"
        var wb = new Workbook();
        var ws = excel_from_data(products,isAdmin);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
    });
  }
}
//Bulk product status update
exports.bulkProductStatusUpdate = function(req,res){
  var fileName = req.body.filename;
  //var user = req.body.user;
  var workbook = null;
  try{
    workbook = xlsx.readFile(importPath + fileName);
  }catch(e){
    console.log(e);
    return  handleError(res,"Error in file upload")
  }
  if(!workbook)
    return res.status(404).send("Error in file upload")
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  req.counter = 0;
  req.numberOfCount = data.length;
  req.errors = [];
  req.successProductArr = [];
  req.assetIdCache = {};
  bulkProductStatusUpdate(req,res,data);
}

exports.parseExcel = function(req,res,next){
  var fileName = req.body.filename;
  //var user = req.body.user;
  var workbook = null;
  try{
    workbook = xlsx.readFile(importPath + fileName);
  }catch(e){
    console.log(e);
    return  handleError(res,new Error("Error in file upload"))
  }
  if(!workbook)
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  req.excelData = data;

  next();
}

function fetchCategory(category, cb) {
  Category.find({
    name: category
  }).exec(function(err, categoryData) {
    if (err) {
      debug(err);
      return cb(err);
    }

    return cb(null, categoryData);
  });
}

function fetchBrand(brand, cb) {
  var filter = {
    name: brand.name,
    'group.name': brand.group,
    'category.name': brand.category
  };

  Brand.find(filter).exec(function(err, brandData) {
    if (err) {
      debug(err);
      return cb(err);
    }

    return cb(null, brandData);
  });
}

function fetchModel(model, cb) {
  var filter = {
    name: model.name,
    'group.name': model.group,
    'category.name': model.category,
    'brand.name': model.brand
  };

  Model.find(filter).exec(function(err, modelData) {
    if (err) {
      debug(err);
      return cb(err);
    }
    return cb(null, modelData);
  });
}


exports.updateExcelData = function (req,res,next){
  if(!req.updateData.length && !req.errorList.length)
    return res.status(500).send('Error while updating');

  var successCount = 0;
  if(!req.updateData.length && req.errorList.length)
    return res.json({successCount : successCount,errorList : req.errorList});

  var dataToUpdate = req.updateData;

  async.eachLimit(dataToUpdate,5,intialize,finalize);

  function finalize(err){
    if(err){
      console.log(err);
      res.status(500).send('Error while updating');
    }

    return res.json({successCount:successCount , errorList : req.errorList});
  }

  function intialize(data,cb){

    var assetId = data.assetId;
    delete data.assetId;

    Product.findOneAndUpdate({assetId:assetId},{'$set':data},function(err,doc){
      if(err || !doc){
        req.errorList.push({
          Error:'Error while updating information',
          rowCount : data.rowCount
        })
        return cb();
      }
      successCount++;
      return cb();
    })
  }
    
}

exports.validateExcelData = function(req,res,next){
  var excelData = req.excelData;

  //console.log('-------------------------',excelData);

  if(!excelData || !excelData.length){
    return res.status(404).send("No Data to update");
  }

  //console.log(excelData);
  var updateData = [];
  var errorList = [];

  async.eachLimit(excelData,10,intialize,finalize);

  function finalize(err){
    if(err){
      console.log(err);
      res.status(500).send('Error while updating');
    }
    req.errorList = errorList;
    req.updateData = updateData;
    next();
  }

  function intialize(info,cb){
    var row = {};
    Object.keys(info).forEach(function(x){
      if(productFieldsMap[x] && info[x]){
        row[productFieldsMap[x]] = info[x];
      }
    })
    row.rowCount = info.__rowNum__;

    if(!row.assetId){
      errorList.push({
        Error:'Asset Id missing',
        rowCount : row.rowCount
      });
      return cb();
    }

    /*AA:Process of bulk update
    validateCategory : validate the category if and only if category related columns present in uploaded sheets
    validateSeller : validate seller if and only if seller mobile and email exists
    validateSeller : will take the info from sheet if not exists then check whether the combination of category,brand,model
    exits in db if found then update
    validateRentInfo : only update of tradeType is RENT or BOTH
    validateAdditionalInfo : Any othe column would be added here which does not require any processing
    */
  
    Product.find({assetId : row.assetId},function(err,doc){
      if(err || !doc.length){
        errorList.push({
          Error : 'No asset id found',
          rowCount : row.rowCount
        })
        return cb();
      }
      
      async.parallel({
        validateCategory : validateCategory, //{}
        validateSeller: validateSeller,
        validateTechnicalInfo: validateTechnicalInfo,
        validateServiceInfo : validateServiceInfo,
        validateRentInfo : validateRentInfo,
        validateAdditionalInfo : validateAdditionalInfo
      },buildData);
    });

    function buildData(err,parseData){
      if(err)
        return cb();

      var obj = {};
      for(var v in parseData){
        if(Object.keys(parseData[v]).length){
          _.extend(obj,parseData[v]);
        }
      }

      if(Object.keys(obj).length){
        obj.assetId = row.assetId;
        obj.rowCount = row.rowCount;
        updateData.push(obj);
      }

      return cb();

    }

    function validateAdditionalInfo(callback){
      var obj = {};

      if(row.isEngineRepaired){
        var engRepOver = trim(row.isEngineRepaired || "").toLowerCase();
        obj.isEngineRepaired = engRepOver == 'yes' || engRepOver == 'y'?true:false;
      }

      var assetStatus = row["Asset_Status*"];
      if(assetStatus && row.tradeType){
        assetStatus = trim(assetStatus).toLowerCase();
        if(['listed','sold','rented'].indexOf(assetStatus) == -1){
           errorList.push({
            Error : 'Not valid status',
            rowCount : row.rowCount
          });
          return callback('Error'); 
        }
      var ret = checkValidTransition(row.tradeType,assetStatus);

      if(!ret){
         errorList.push({
            Error : 'Invalid status transition',
            rowCount : row.rowCount
          });
          return callback('Error'); 
      }else{
          obj.updatedAt = new Date();
          obj.assetStatus = assetStatus;
          if(assetStatus != 'listed') {
            obj.featured = false;
            obj.isSold = true;
          }
        }
      }

      if(row.productCondition)
        obj["productCondition"] = trim(row.productCondition || "").toLowerCase();

      if(row.featured){
        var featured = trim(row.featured || "").toLowerCase();
        obj["featured"] =  featured == 'yes' || featured == 'y'?true:false;
      }
        
      ['country','state','city'].forEach(function(x){
        if(row[x])
          obj[x] = trim(row[x]);
      })

      if(row.motorOperatingHour)
        obj.operatingHour = row.motorOperatingHour;

      var additionalCols = ['comment','rateMyEquipment','mileage','serialNo','mfgYear','variant','tradeType'];
      additionalCols.forEach(function(x){
        if(row[x]){
          obj[x] = row[x];
        }
      });
      return callback(null,obj);
    }

    function validateRentInfo(callback){
      var product = {};
      if (row.tradeType && row.tradeType != "SELL") {
        product["rent"] = {};

        var rateTypeH = trim(row["rateHours"] || "").toLowerCase();
        if (rateTypeH == "yes" || rateTypeH == 'y') {
          product["rent"].rateHours = {};
          product["rent"].rateHours.rateType = "hours";
        }

        var rateTypeD = trim(row["ratedays"] || "").toLowerCase();
        if (rateTypeD == "yes" || rateTypeD == 'y') {
          product["rent"].rateDays = {};
          product["rent"].rateDays.rateType = "days";
        }

        var rateTypeM = trim(row["rateMonths"] || "").toLowerCase();
        if (rateTypeM == "yes" || rateTypeM == 'y') {
          product["rent"].rateMonths = {};
          product["rent"].rateMonths.rateType = "months";
        }
        var fromDate = new Date(row["fromDate"]);
        var validDate = isValid(fromDate);
        if (!fromDate || !validDate) {
          errorList.push({
            Error : 'Mandatory field Availability_of_Asset_From is invalid or not present',
            rowCount : row.rowCount
          });
          return callback('Error');
        }

        product["rent"].fromDate = fromDate;
        var toDate = new Date(row["toDate"]);
        validDate = isValid(fromDate);
        if (!toDate || !validDate) {
         errorList.push({
            Error : 'Mandatory field Availability_of_Asset_To is invalid or not present',
            rowCount : row.rowCount
          });
          return callback('Error');
        }
        product["rent"].toDate = toDate;
        
        //rent hours
        var negotiableFlag = true;
        if (rateTypeH == "yes" || rateTypeH == 'y') {
          negotiableFlag = false;
          var minPeriodH = row["minPeriodH"];
          if (!minPeriodH) {
            errorList.push({
              Error : 'Mandatory field Min_Rental_Period_Hours is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateHours.minPeriodH = Number(trim(minPeriodH));

          var maxPeriodH = row["maxPeriodH"];
          if (!maxPeriodH) {
            errorList.push({
              Error : 'Mandatory field Max_Rental_Period_Hours is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateHours.maxPeriodH = Number(trim(maxPeriodH));

          var rentAmountH = row["rentAmountH"];
          if (!rentAmountH) {
            errorList.push({
              Error : 'Mandatory field Rent_Amount_Hours is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateHours.rentAmountH = Number(trim(rentAmountH));

          var seqDepositH = row["seqDepositH"];
          if (!seqDepositH) {
            errorList.push({
              Error : 'Mandatory field Security_Deposit_Hours is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateHours.seqDepositH = Number(trim(seqDepositH));
        }
        // rent days
        if (rateTypeD == "yes" || rateTypeD == 'y') {
          negotiableFlag = false;
          var minPeriodD = row["minPeriodD"];
          if (!minPeriodD) {
            errorList.push({
              Error : 'Mandatory field Min_Rental_Period_Days is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateDays.minPeriodD = Number(trim(minPeriodD));

          var maxPeriodD = row["maxPeriodD"];
          if (!maxPeriodD) {
            errorList.push({
              Error : 'Mandatory field Max_Rental_Period_Days is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateDays.maxPeriodD = Number(trim(maxPeriodD));

          var rentAmountD = row["rentAmountD"];
          if (!rentAmountD) {
            errorList.push({
              Error : 'Mandatory field Rent_Amount_Days is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateDays.rentAmountD = Number(trim(rentAmountD));

          var seqDepositD = row["seqDepositD"];
          if (!seqDepositD) {
            errorList.push({
              Error : 'Mandatory field Security_Deposit_Days is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateDays.seqDepositD = Number(trim(seqDepositD));
        }
        //rent months
        if (rateTypeM == "yes" || rateTypeM == 'y') {
          negotiableFlag = false;
          var minPeriodM = row["minPeriodM"];
          if (!minPeriodM) {
            errorList.push({
              Error : 'Mandatory field Min_Rental_Period_Months is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateMonths.minPeriodM = Number(trim(minPeriodM));

          var maxPeriodM = row["maxPeriodM"];
          if (!maxPeriodM) {
            errorList.push({
              Error : 'Mandatory field Max_Rental_Period_Months is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateMonths.maxPeriodM = Number(trim(maxPeriodM));

          var rentAmountM = row["rentAmountM"];
          if (!rentAmountM) {
            errorList.push({
              Error : 'Mandatory field Rent_Amount_Months is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateMonths.rentAmountM = Number(trim(rentAmountM));

          var seqDepositM = row["seqDepositM"];
          if (!seqDepositM) {
            errorList.push({
              Error : 'Mandatory field Security_Deposit_Months is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          product["rent"].rateMonths.seqDepositM = Number(trim(seqDepositM));
        }
        product["rent"].negotiable = negotiableFlag;
      } else if(row.tradeType === 'SELL'){
        var gp = row["grossPrice"];
        var prOnReq = row["priceOnRequest"];
        var cr = row["currencyType"];
        if(gp && cr){
            product["grossPrice"] = Number(trim(gp));
            product["currencyType"] = trim(cr);
          } else {
            errorList.push({
              Error : 'Mandatory field Gross_Price and Currency is invalid or not present',
              rowCount : row.rowCount
            });
            return callback('Error');
          }
          if(!prOnReq){
            product["priceOnRequest"] = false;
          }else{
            prOnReq = trim(prOnReq).toLowerCase();
            if(prOnReq == 'yes' || prOnReq == 'y') {
              product["priceOnRequest"] = true; 
            }else {
              product["priceOnRequest"] = false;
            }
          }
        }
      return callback(null,product);
    }

    //validate service related information
    function validateServiceInfo(callback){
      var obj = {};
       ['authServiceStation','serviceAt','operatingHour'].forEach(function(x){
        if(row[x]){
          if(!obj.serviceInfo){
            obj.serviceInfo = [{}]
          }
          obj.serviceInfo[0][x] = row[x];
        }
      })

      if(row.servicedate){
        var servicedate = new Date(row["servicedate"]);
        var validDate = isValid(servicedate);
        if(servicedate && validDate) {
          obj["serviceInfo"][0].servicedate =  servicedate; 
        }

      }
      return callback(null,obj);
    }

    //validate Technical information
    function validateTechnicalInfo(callback){
      var obj = {};
      var techCols = ['grossWeight','operatingWeight','bucketCapacity','enginePower','liftingCapacity'];
      techCols.forEach(function(x){
        if(row[x] && !isNaN(row[x])){
          if(!obj.technicalInfo){
            obj.technicalInfo = {};
          }
          obj.technicalInfo[x] = Number(row[x]);
        }
      })

      if(!obj.technicalInfo && row.category && row.brand && row.model){
        productInfoModel.find({
          type : 'technical',
          'information.category' : row.category,
          'information.brand' : row.brand,
          'information.model' : row.model
        }).exec(function(err,data){
          if(!err && data.length){
            obj.technicalInfo = {};
            obj.technicalInfo.grossWeight = data[0]._doc.information.grossWeight;
            obj.technicalInfo.operatingWeight = data[0]._doc.information.operatingWeight;
            obj.technicalInfo.bucketCapacity = data[0]._doc.information.bucketCapacity;
            obj.technicalInfo.enginePower = data[0]._doc.information.enginePower;
            obj.technicalInfo.liftingCapacity = data[0]._doc.information.liftingCapacity;  
          }
          return callback(null,obj);
        })
      } else {
        return callback(null,obj);
      }
    }


    //validate seller information if exists
    function validateSeller(callback){
      var obj = {};
      if(row.seller_mobile && row.seller_email){
        User.find({
          mobile : row.seller_mobile,
          email : row.seller_email
        },function(err,seller){
          if(err || !seller){
            errorList.push({
              Error : 'Error while fetching seller',
              rowCount : row.rowCount
            })
            return callback('Error');
          }

          if(!seller.length){
            errorList.push({
              Error : 'Seller not exist',
              rowCount : row.rowCount
            })
            return callback('Error');
          }

          obj.seller = {};
          obj.seller["country"] = seller[0]['country'];
          obj.seller["email"] = seller[0]['email'];
          obj.seller["mobile"] = seller[0]['mobile'];
          obj.seller["company"] = seller[0]['company'];
          obj.seller["countryCode"] = seller[0]['countryCode'];
          obj.seller["userType"] = seller[0]['userType'];
          obj.seller["role"] = seller[0]['role'];
          obj.seller["lname"] = seller[0]['lname'];
          obj.seller["fname"] = seller[0]['fname'];
          obj.seller["_id"] = seller[0]['_id'] + "";
          return callback(null,obj);
        })
      }else
        return callback(null,obj);
    } 


    //validate Category if exists
    function validateCategory(callback){
      var obj = {};
      var e ;
      if(row.category && row.brand && row.model ){
        if(row.category === 'Other' && row.brand === 'Other' && row.model === 'Other'){
          e = ['other_category','other_brand','other_model'].some(function(x){
            if(!row[x]){
              errorList.push({
                Error:'Missing mandatory parameter: ' + x,
                rowCount : row.rowCount
              });
              return true;
            }
          })

          if(e)
            return callback('Error');
        } 

        fetchCategory(row.category,function(err,category){
          if(err || !category){
            errorList.push({
              Error : 'Error while fetching category',
              rowCount : row.rowCount
            })
            return callback('Error');
          }

          if(!category.length){
            errorList.push({
              Error : 'Category not exist',
              rowCount : row.rowCount
            })
            return callback('Error');
          }

          var brandFilter = {
            name: row.brand,
            category: row.category,
            group: category[0]._doc.group.name
          };

          fetchBrand(brandFilter,function(err,brand){
            if(err || !brand){
              errorList.push({
                Error : 'Error while fetching brand',
                rowCount : row.rowCount
              })
              return callback('Error');
            }

            if(!brand.length){
              errorList.push({
                Error : 'Brand not exist',
                rowCount : row.rowCount
              })
              return callback('Error');
            }

            var modelFilter = {
              name: row.model,
              category: row.category,
              group: category[0]._doc.group.name,
              brand: row.brand
            }

            fetchModel(modelFilter,function(err,model){
              if(err || !model){
                errorList.push({
                  Error : 'Error while fetching model',
                  rowCount : row.rowCount
                })
                return callback('Error');
              }

              if(!model.length){
                errorList.push({
                  Error : 'model not exist',
                  rowCount : row.rowCount
                })
                return callback('Error');
              }

              obj.category = {
                _id : category[0]._doc._id,
                name : category[0]._doc.name
              };

              obj.brand = {
                _id : brand[0]._doc._id,
                name : brand[0]._doc.name
              };

              obj.model = {
                _id : model[0]._doc._id,
                name : model[0]._doc.name
              };

              obj.name = row.category + ' ' + row.brand + ' ' + row.model;

              if(row.category === 'Other' && row.brand === 'Other' && row.model === 'Other'){
                obj.category.otherName =  row.other_category;
                obj.brand.otherName =  row.other_brand;
                obj.model.otherName =  row.other_model;
                obj.name = row.other_category + ' ' + row.other_brand + ' ' + row.other_model;
              }

              if(row.variant)
                obj.name += ' ' + row.variant;
              return callback(null,obj);
            })
          })
        })
      }
      else {
        return callback(null,obj);
      }
    }
  }
}

function bulkProductStatusUpdate(req,res,data){
  if(req.counter < req.numberOfCount){
    var row = data[req.counter];
    var assetIdVal = Number(row["Asset_ID*"]);
    if(!assetIdVal){
      var errorObj = {};
      errorObj['rowCount'] = req.counter + 2;
      errorObj['message'] =  "Asset_ID is mandatory to be filled.";
      req.errors[req.errors.length] = errorObj;
      req.counter ++;
      bulkProductStatusUpdate(req,res,data);
      return;
    }
    assetIdVal = assetIdVal + '';
    //console.log("AssetID:",assetIdVal);
      Product.findOne({assetId:assetIdVal},function(err,product){
        if(err){
          var errorObj = {};
          errorObj["rowCount"] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Unknown Error.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          bulkProductStatusUpdate(req,res,data); 
          return;
        }else if(!product){
            var errorObj = {};
            errorObj["rowCount"] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj["message"] = "Asset_ID does not exist in the syatem.";
            req.errors[req.errors.length] = errorObj;
            req.counter ++;
            bulkProductStatusUpdate(req,res,data);
            return; 
        }else{
             var assetStatus = row["Asset_Status*"];
            if(!assetStatus){
               var errorObj = {};
                errorObj["rowCount"] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj["message"] = "Status not found.";
                req.errors[req.errors.length] = errorObj;
                req.counter ++;
                bulkProductStatusUpdate(req,res,data);
                return; 
            }
            assetStatus = trim(assetStatus).toLowerCase();
            if(['listed','sold','rented'].indexOf(assetStatus) == -1){
               var errorObj = {};
                errorObj["rowCount"] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj["message"] = "Not valid status.";
                req.errors[req.errors.length] = errorObj;
                req.counter ++;
                bulkProductStatusUpdate(req,res,data);
                return; 
            }
            var ret = checkValidTransition(product.tradeType,assetStatus);

            if(!ret){
                var errorObj = {};
                errorObj["rowCount"] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj["message"] = "Not valid status.";
                req.errors[req.errors.length] = errorObj;
                req.counter ++;
                bulkProductStatusUpdate(req,res,data);
                return;
            }else{
                var dataToSet = {};
                dataToSet.updatedAt = new Date();
                dataToSet.assetStatus = assetStatus;
                if(assetStatus != 'listed') {
                  dataToSet.featured = false;
                  dataToSet.isSold = true;
                }
                //console.log(assetIdVal);
                Product.update({assetId:assetIdVal},{$set:dataToSet},function(err){
                  if (err) { var errorObj = {};
                    errorObj["rowCount"] = req.counter + 2;
                    errorObj['AssetId'] = assetIdVal;
                    errorObj["message"] = "Unknown Error.";
                    req.errors[req.errors.length] = errorObj;
                    req.counter ++;
                    bulkProductStatusUpdate(req,res,data);
                    return; 
                  } else {
                    //create app notificaton
                    var productData = {};
                    productData.user = {};
                    productData.user._id = product.seller._id;
                    productData.user.fname = product.seller.fname;
                    productData.productId = product._id;
                    productData.message = product.name;
                    if(dataToSet.assetStatus == 'sold')
                      productData.notificationFor = "Sold";
                    else if(dataToSet.assetStatus == 'rented')
                      productData.notificationFor = "Rented";
                    else if(product.status && dataToSet.assetStatus == 'listed')
                      productData.notificationFor = "Approved";
                    productData.imgsrc = product.assetDir + "/"+ product.primaryImg;
                    appNotificationCtrl.checkProductInCart(productData,function(){
                      req.successProductArr[req.successProductArr.length] = product;
                      req.counter ++;
                      bulkProductStatusUpdate(req,res,data);
                    });
                    
                  }
              });
            }
        }; 

      })
  }else{
    res.status(200).json({successCount:req.successProductArr.length,errorList:req.errors});
  }
}

function checkValidTransition(tradeType,assetStatus){
  console.log(tradeType, assetStatus);
  var ret = false;
  if(tradeType == 'BOTH')
      ret = true;
  else if(tradeType =='RENT' && assetStatus != 'sold')
    ret = true;
  else if(tradeType =='SELL' && assetStatus != 'rented')
    ret = true;
  return ret;

}
//product import functionality
exports.importProducts = function(req,res){
  var fileName = req.body.filename;
  //var user = req.body.user;
  var workbook = null;
  try{
    workbook = xlsx.readFile(importPath + fileName);
  }catch(e){
    console.log(e);
    return  handleError(res,new Error("Error in file upload"))
  }
  if(!workbook)
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  req.counter = 0;
  req.numberOfCount = data.length;
  req.errors = [];
  //req.user = user;
  req.successProductArr = [];
  req.assetIdCache = {};
  importProducts(req,res,data);
}

function importProducts(req,res,data){
  if(req.counter < req.numberOfCount){
    var row = data[req.counter];
    var assetIdVal = row["Asset_ID*"];
    if(!assetIdVal){
      var errorObj = {};
      errorObj['rowCount'] = req.counter + 2;
      errorObj['message'] =  "Asset_ID is mandatory to be filled.";
      req.errors[req.errors.length] = errorObj;
      req.counter ++;
      importProducts(req,res,data);
      return;
    }
    assetIdVal = trim(assetIdVal);
    if(req.assetIdCache[assetIdVal]){
      var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Duplicate Asset_ID " + assetIdVal + " in excel.";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
    }else{
      req.assetIdCache[assetIdVal] = true;      
    }
    var product = {};
    Seq()
    .seq(function(){
      var self = this;
       Product.find({assetId:assetIdVal},function(err,products){
        if(err) return handleError(res, err); 
        if(products.length > 0){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = assetIdVal + " Asset_ID is already exist.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }else{

          //product["assetId"] = trim(assetId);
          //self();
          IncomingProduct.find({assetId:assetIdVal},function(err,prds){ 
            if(err) return handleError(res, err);
            if(prds.length > 0){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] =  "Product with this Asset_Id is already exist in waiting queue.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }else{
              product.assetId = assetIdVal;
              self();
            }
          });      
        }
      })
    })
    .seq(function(){
      var self = this;
       var categoryName = row["Category*"];
      if(!categoryName){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Category is mandatory to be filled";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;

      }
      categoryName = trim(categoryName);
      var catTerm = new RegExp("^" + categoryName + "$", 'i');
      Category.find({name:catTerm},function(err,cats){
        if(err) return handleError(res, err); 
        if(cats.length > 0){
          product.group = cats[0].group;
          product.category = {};
          product.category['_id'] = cats[0]['_id'] + "";
          product.category['name'] = categoryName;
          product["name"] = categoryName;
          if(categoryName == "Other"){
            var othCat = row["Other_Category*"];
            if(!othCat){
               var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Other_Category is mandatory to be filled";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            var ctg = getOtherObj(cats,"category");
            product.group = ctg.group;
            product.category['_id'] = ctg['_id'] + "";
            product.category['otherName'] = trim(othCat);
            product["name"] = product.category['otherName'];
          }
          self();
        }else{
          var errorObj = {};
           errorObj['rowCount'] = req.counter + 2;
           errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Category '" + categoryName + "' does not exist in master data.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
        }
      })


    })
    .seq(function(){
       var self = this;
      var brandName  = row["Product_Brand*"];
      if(!brandName){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Product_Brand is mandatory to be filled";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;

      }
      brandName  = trim(brandName);
      if(product.category['name'] == "Other" && brandName != "Other"){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Category '"+ product.category['name'] +"' and  Brand '" + brandName +"' relation does not exist.";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
      }
      var brTerm = new RegExp("^" + brandName + "$", 'i');
      var catTerm = new RegExp("^" + product.category.name + "$", 'i');
      if(brandName == "Other")
        catTerm = brTerm;

       Brand.find({name:brTerm,'category.name':catTerm},function(err,brds){
        if(err) return handleError(res, err); 
        if(brds.length > 0){
          product.brand = {};
          product.brand['_id'] = brds[0]['_id'] + "";
          product.brand['name'] = brandName;
          if(brandName == "Other"){
            var othBrand = row["Other_Brand*"];
            if(!othBrand){
               var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Other_Brand is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            var bd = getOtherObj(brds,"brand");
            product.brand['_id'] = bd['_id'] + "";
            product.brand['otherName'] = trim(othBrand);
            product["name"] += " " + product.brand['otherName'];
          }else{
            product["name"] += " " + brandName;
          }
             
          self();
        }else{
          var errorObj = {};
           errorObj['rowCount'] = req.counter + 2;
           errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Category, Brand relation does not exist in Master Data.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
        }
      })
    })
    .seq(function(){
      var self = this;

      var modelName  = row["Product_Model*"];
       if(!modelName){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Product_Model is mandatory to be filled.";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
      }
      modelName  = trim(modelName);
      if(product.brand['name'] == "Other" && modelName != "Other"){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Brand, Model relation does not exist in Master Data.";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
      }
      var mdTerm = new RegExp("^" + modelName + "$", 'i');
      var brTerm = new RegExp("^" + product.brand.name + "$", 'i');
      var catTerm = new RegExp("^" + product.category.name + "$", 'i');
      if(modelName == "Other"){
        brTerm = mdTerm;
        catTerm = mdTerm;
      }
      Model.find({name:mdTerm,'category.name':catTerm,'brand.name':brTerm},function(err,models){
        if(err) return handleError(res, err); 
        if(models.length > 0){
          product.model = {};
          product.model['_id'] = models[0]['_id'] + "";
           product.model['name'] = modelName;
          if(modelName == "Other"){
            var othModel = row["Other_Model*"];
            if(!othModel){
               var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Other_Model is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            var md = getOtherObj(models,"model");
            product.model['_id'] = md['_id'] + "";
            product.model['otherName'] = trim(othModel);
            product["name"] += " " + product.model['otherName'];
          }else{
              product["name"] += " " + modelName;
          }

          if(row["Variant"]){
            product["name"] += " " + row["Variant"];
            product["variant"] = row["Variant"];
          }
          self();
        }else{
          var errorObj = {};
           errorObj['rowCount'] = req.counter + 2;
           errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Category, Brand, Model relation does not exist in Master Data.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
        }
      })
    })
    .seq(function(){
      var self = this;

      var subCategoryName  = row["Sub_Category"] || "";
      subCategoryName  = trim(subCategoryName);
      SubCategory.find({name:subCategoryName},function(err,subcategorys){
        if(err) return handleError(res, err); 
        if(subcategorys.length > 0){
          product.subcategory = {};
          product.subcategory['_id'] = subcategorys[0]['_id'] + "";
          product.subcategory['name'] = subCategoryName;
        }
        self();
      })
    })
    .seq(function(){
      var self = this;
      var sellerMobile = row["Seller_Mobile*"];
       if(!sellerMobile){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj['message'] = "Seller_Mobile is mandatory to be filled.";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
      }
      sellerMobile = trim(sellerMobile)
       User.find({mobile:sellerMobile, deleted:false},function(err,usrs){
        if(err) return handleError(res, err); 
        if(usrs.length > 0){
         product.seller = {};
         product.seller["country"] = usrs[0]['country'];
         product.seller["email"] = usrs[0]['email'];
         product.seller["mobile"] = usrs[0]['mobile'];
         product.seller["company"] = usrs[0]['company'];
         product.seller["countryCode"] = usrs[0]['countryCode'];
         product.seller["userType"] = usrs[0]['userType'];
         product.seller["role"] = usrs[0]['role'];
         product.seller["lname"] = usrs[0]['lname'];
         product.seller["fname"] = usrs[0]['fname'];
         product.seller["_id"] = usrs[0]['_id'] + "";
         self();
        }else{
          var errorObj = {};
          errorObj["rowCount"] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Seller_Mobile does not exist in the syatem.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
        }
      })
    })
    .seq(function(){
        var self = this;
        product["createdAt"] = new Date();
        product["updatedAt"] = new Date();
        product["relistingDate"] = new Date();
        var country = row["Country*"];
        if(!country){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Country is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }

        product["country"] = trim(country);
        product["operatingHour"] = trim(row["Motor_Operating_Hours"] || "");
        product["mileage"]  = trim(row["Mileage"] || "");
        product["serialNo"] = trim(row["Machine_Serial_No"] || "");

        var tradeType = row["Trade_Type*"];
        if(!tradeType ){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Trade_Type is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }
        tradeType = trim(tradeType);
        if(['RENT','SELL','BOTH'].indexOf(tradeType) == -1){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Trade_Type should have a value selected from its picklist only.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }

        product["tradeType"] = trim(tradeType);
        if(tradeType != "RENT") {
          var gp = row["Gross_Price*"];
           var prOnReq = row["Price_on_Request*"];
          var cr = row["Currency*"];
          if(gp && cr){
              product["grossPrice"] = Number(trim(gp));
              product["currencyType"] = trim(cr);
            } else {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Gross_Price and Currency is mandatory to filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            if(!prOnReq){
              product["priceOnRequest"] = false;
            }else{

                prOnReq = trim(prOnReq).toLowerCase();
                if(prOnReq == 'yes' || prOnReq == 'y') {
                  product["priceOnRequest"] = true; 
                }else {
                  product["priceOnRequest"] = false;
                }
            }
            
        }          

        product["productCondition"] = trim(row["Product_Condition"] || "").toLowerCase();

        var engRepOver = trim(row["Engine_Repaired_Overhauling"] || "").toLowerCase();
        product["isEngineRepaired"] = engRepOver == 'yes' || engRepOver == 'y'?true:false;
        var state = row["State*"];
        if(!state){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "State is mandatory to filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }
        product["state"] = trim(state);

        var location = row["Location*"];
        if(!location){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Location is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }
        product["city"] = trim(location);
        product["comment"] = trim(row["Comments"] || "");
        var mfgYear = trim(row["Manufacturing_Year*"]|| "");
        if(!mfgYear || mfgYear.length != 4){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = " Manufacturing_Year should be in YYYY format.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
         
        }
        product["mfgYear"] = mfgYear;

        product["isSold"] = false;
        product["status"] = false;
        product["expiryAlert"] = false;
        product["expired"] = false;
        product["deleted"] = false;
        var featured = trim(row["Featured"] || "").toLowerCase();
        product["featured"] =  featured == 'yes' || featured == 'y'?true:false;

        //rent info

        if(tradeType != "SELL") {
          product["rent"] = {};

        var rateTypeH = trim(row["Rent_Hours"] || "").toLowerCase();
        if(rateTypeH == "yes" || rateTypeH == 'y'){
          product["rent"].rateHours = {};
          product["rent"].rateHours.rateType =  "hours";
        }

        var rateTypeD = trim(row["Rent_Days"] || "").toLowerCase();
        if(rateTypeD == "yes" || rateTypeD == 'y') {
          product["rent"].rateDays = {};
          product["rent"].rateDays.rateType =  "days";
        }

        var rateTypeM = trim(row["Rent_Months"] || "").toLowerCase();
        if(rateTypeM == "yes" || rateTypeM == 'y') {
          product["rent"].rateMonths ={};
          product["rent"].rateMonths.rateType = "months";
        }
          var fromDate = new Date(row["Availability_of_Asset_From"]);
          var validDate = isValid(fromDate);
          
          if(!fromDate || !validDate){
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = "Availability_of_Asset_From date is blank or invalid to be filled.";
            req.errors[req.errors.length] = errorObj;
            req.counter ++;
            importProducts(req,res,data);
            return;
          }
          product["rent"].fromDate = fromDate;
          var toDate = new Date(row["Availability_of_Asset_To"]);
          validDate = isValid(fromDate);
          if(!toDate || !validDate){
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = "Availability_of_Asset_To date is blank or invalid to be filled.";
            req.errors[req.errors.length] = errorObj;
            req.counter ++;
            importProducts(req,res,data);
            return;
          }
          product["rent"].toDate = toDate;
          //rent hours
          var negotiableFlag = true;
          if(rateTypeH == "yes" || rateTypeH == 'y') {
            negotiableFlag = false;
            var minPeriodH = row["Min_Rental_Period_Hours"];
            if(!minPeriodH){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Min_Rental_Period_Hours is required to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateHours.minPeriodH = Number(trim(minPeriodH));

            var maxPeriodH = row["Max_Rental_Period_Hours"];
            if(!maxPeriodH){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Max_Rental_Period_Hours is required to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateHours.maxPeriodH = Number(trim(maxPeriodH));

            var rentAmountH = row["Rent_Amount_Hours"];
            if(!rentAmountH){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Rent_Amount_Hours is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateHours.rentAmountH = Number(trim(rentAmountH));

            var seqDepositH = row["Security_Deposit_Hours"];
            if(!seqDepositH){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Security_Deposit_Hours is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateHours.seqDepositH = Number(trim(seqDepositH));
          }
          // rent days
          if(rateTypeD == "yes" || rateTypeD == 'y') {
            negotiableFlag = false;
            var minPeriodD = row["Min_Rental_Period_Days"];
            if(!minPeriodD){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Min_Rental_Period_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateDays.minPeriodD = Number(trim(minPeriodD));

            var maxPeriodD = row["Max_Rental_Period_Days"];
            if(!maxPeriodD){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Max_Rental_Period_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateDays.maxPeriodD = Number(trim(maxPeriodD));

            var rentAmountD = row["Rent_Amount_Days"];
            if(!rentAmountD){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Rent_Amount_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateDays.rentAmountD = Number(trim(rentAmountD));

            var seqDepositD = row["Security_Deposit_Days"];
            if(!seqDepositD){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Security_Deposit_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateDays.seqDepositD = Number(trim(seqDepositD));
          }
          //rent months
          if(rateTypeM == "yes" || rateTypeM == 'y') {
            negotiableFlag = false;
            var minPeriodM = row["Min_Rental_Period_Months"];
            if(!minPeriodM){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Min_Rental_Period_Months is mandatory to filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateMonths.minPeriodM = Number(trim(minPeriodM));

            var maxPeriodM = row["Max_Rental_Period_Months"];
            if(!maxPeriodM){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Max_Rental_Period_Months is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateMonths.maxPeriodM = Number(trim(maxPeriodM));

            var rentAmountM = row["Rent_Amount_Months"];
            if(!rentAmountM){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Rent_Amount_Months is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateMonths.rentAmountM = Number(trim(rentAmountM));

            var seqDepositM = row["Security_Deposit_Months"];
            if(!seqDepositM){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Security_Deposit_Months is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
            }
            product["rent"].rateMonths.seqDepositM = Number(trim(seqDepositM));
          }
          product["rent"].negotiable = negotiableFlag;
        }
        
        product["rateMyEquipment"] = trim(row["Rate_My_Equipment"] || "");

        // technical info
        product["technicalInfo"] = {};
        product["technicalInfo"].liftingCapacity = trim(row["Lifting_Capacity"] || "");
        product["technicalInfo"].enginePower = trim(row["Engine_Power"] || "");
        product["technicalInfo"].bucketCapacity = trim(row["Bucket_Capacity"]  || "");
        product["technicalInfo"].operatingWeight = trim(row["Operating_Weight"] || "");
        product["technicalInfo"].grossWeight = trim(row["Gross_Weight"] || "");
        product["technicalInfo"].params = [{}];

        // service info
        product["serviceInfo"] = [{}];
        product["serviceInfo"][0].authServiceStation = trim(row["Authorized_Station"] || "");
        product["serviceInfo"][0].serviceAt = trim(row["Service_at_KMs"] || "");
        product["serviceInfo"][0].operatingHour = trim(row["Operating_Hours"] || "");
        
        var servicedate = new Date(row["Service_Date"]);
        var validDate = isValid(servicedate);
          
        if(servicedate && validDate) {
          product["serviceInfo"][0].servicedate =  servicedate; 
        }

        //product["serviceInfo"][0].servicedate =  new Date(trim(row["Service_Date"] || "")) || "";
        product.user = req.body.user;
        product.images = [{}];
        IncomingProduct.create(product,function(err,pd){
          if(err){
            console.log("error in pushing prduct in queue",err);
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Unknown error.";
              req.errors[req.errors.length] = errorObj;
          }else{
            req.successProductArr[req.successProductArr.length] = product;
          }
          req.counter ++;
          importProducts(req,res,data);
        });
        //req.counter ++;
        //importProducts(req,res,data);
    })
  }else{
    res.status(200).json({successCount:req.successProductArr.length,errorList:req.errors});
  }
  
}

function isValid(d) {
  return d.getTime() === d.getTime();
}; 

function getOtherObj(arr,term){
  var objRef = null;
  var found = false;
  for(var i = 0;i < arr.length;i++){
    var item = arr[i];
     switch(term){
      case "model":
       if(item.group.name== "Other" && item.category.name== "Other" && item.brand.name== "Other"){
          objRef = item;
          found = true;
        }
      break;
      case "brand":
       if(item.group.name== "Other" && item.category.name== "Other"){
          objRef = item;
          found = true;
        }
      break;
      case "category":
        if(item.group.name== "Other"){
          objRef = item;
          found = true;
        }
      break;
    }
    if(found)
      break;
  }
  return objRef;
}

function fileExists(filePath)
{
    try
    {
        return fs.statSync(filePath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

exports.createOrUpdateAuction = function(req,res){
  Seq()
    .seq(function(){
      var self = this;
      if(!req.body.payment)
        self();
      else{
        PaymentTransaction.create(req.body.payment,function(err,paytm){
          if(err){return handleError(res,err)}
          else{
            req.payTransId = paytm._id;
            self();     
          }
        })
      }
    })
    .seq(function(){
      var self = this;
      if(!req.body.valuation)
        self();
      else{
        if(req.payTransId)
        req.body.valuation.transactionId = req.payTransId + "";
        ValuationReq.create(req.body.valuation,function(err,vals){
          if(err){return handleError(res,err)}
          else{
            req.valuationId = vals._id;
            self();     
          }
        })
      }
    })
    .seq(function(){
      var self = this;
      if(req.payTransId)
        req.body.auction.transactionId = req.payTransId + "";
      if(req.valuationId){
        req.body.auction.valuation = {};
        req.body.auction.valuation._id = req.valuationId + "";
        req.body.auction.valuation.status = req.body.valuation.status;
      }

      if(req.body.auction._id){
        AuctionReq.update({_id:req.body.auction._id},{$set:req.body.auction},function(err,acts){
          if(err){return handleError(res,err)}
          else{
            req.auctionId = req.body.auction._id;
            self();
          }
        })
      }else{
        AuctionReq.create(req.body.auction,function(err,acts){
          if(err){return handleError(res,err);}
          else{
            req.auctionId = acts._id;
            self();
            }     
        })
      }
    })
    .seq(function(){
      var self = this;
      var auctionUpdate = {};
      auctionUpdate._id = req.auctionId + "";
      if(req.valuationId)
        auctionUpdate.valuationId = req.valuationId + "";
      Product.update({_id:req.body.auction.product._id},{$set:{auction:auctionUpdate}},function(err,prds){
         if(err){return handleError(res,err)}
          else{
            var resObj = {};
            resObj.auctionId =  req.auctionId;
            if(req.payTransId)
              resObj.transactionId = req.payTransId;
            if(req.valuationId)
              resObj.valuationId = req.valuationId;
            res.status(200).json(resObj);
          }
      })
    })
}

//functionality for assigning  Uniq assetIds
exports.updateAssetId = function(req,res){
  Product.find({$or:[{"assetId":""},{"assetId":{$exists:false}}]},function(err,results){
    if(err){ return handleError(res,err);}
    if(results.length >0){
    req.counter = 0;
    req.totalCount = results.length;
    req.products = results;
    updateAssetId(req,res);
  }
  else
    return handleError(res,"No record to update");
  });
}

function updateAssetId(req,res){
  if(req.counter < req.totalCount){
    var doc = req.products[req.counter];
    var uniqId = new Date().getTime();
       Product.find({"assetId":uniqId},function(err,prods){
        if(err)return handleError(res,err);
        if(prods.length > 0){
           updateAssetId(req,res);
          return;
        }
      });
      Product.update({'_id':doc._id},{$set:{"assetId":uniqId}},function(err,result){
        if(err){return handleError(res,err)};
         req.counter ++;
         updateAssetId(req,res);
      });      
  }else
res.status(200).send("successful updation of" + req.counter +" "+ "records");

  }

  function handleError(res, err) {
  console.log(err);
  if(res instanceof Error)
   {var temp=res;
    res=err;
    err=temp;
   }
  return res.status(500).send(err);
}

