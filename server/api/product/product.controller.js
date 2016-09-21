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
  if(req.body.featured)
    filter["featured"] = req.body.featured;
  var arr = [];
  if(req.body.searchstr){
    arr[arr.length] = { name: { $regex: term }};
    arr[arr.length] = { "group.name": { $regex: term }};
    arr[arr.length] = { "category.name": { $regex: term }};
    arr[arr.length] = { "model.name": { $regex: term }};
    arr[arr.length] = { "brand.name": { $regex: term }};
    
  }
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

  if(arr.length > 0)
    filter['$or'] = arr;
  
  if(req.body.tradeType){
   filter["tradeType"] = {$in:[req.body.tradeType,'BOTH']};
  }
  if(req.body.tradeValue)
   filter["tradeType"] = req.body.tradeValue; 
  if(req.body.assetStatus)
    filter["assetStatus"] = req.body.assetStatus;
  if(req.body.assetId)
    filter["assetId"] = req.body.assetId;
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
    var arr = [];
    arr[arr.length] = { "user._id": req.body.userid};
    arr[arr.length] = { "seller._id": req.body.userid};
    filter['$or'] = arr; 
  } else if(req.body.userid) {
    filter["seller._id"] = req.body.userid;
  }
  var query = Product.find(filter).sort( { createdAt: -1 } );
  query.exec(
               function (err, products) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(products);
               }
  );

};

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
              console.log("------- ",err);
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
    range = {s: {c:0, r:0}, e: {c:36, r:data.length }};
  else
    range = {s: {c:0, r:0}, e: {c:22, r:data.length }};

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
      sellerName = product.seller.fname;
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

//export data into excel
exports.exportProducts = function(req,res){
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  var isAdmin = true;
  if(req.body.userid){
    filter["seller._id"] = req.body.userid;
    isAdmin = false;
  }
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
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  req.counter = 0;
  req.numberOfCount = data.length;
  req.errors = [];
  req.successProductArr = [];
  req.assetIdCache = {};
  bulkProductStatusUpdate(req,res,data);
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
    return  handleError(res,"Error in file upload")
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
       User.find({mobile:sellerMobile},function(err,usrs){
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
        product["status"] = true;
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
          if(rateTypeH == "yes" || rateTypeH == 'y') {
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
        product["serviceInfo"][0].servicedate =  new Date(trim(row["Service_Date"] || "")) || "";
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
          if(err){return handleError(err,res)}
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
          if(err){return handleError(err,res)}
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
      if(req.valuationId)
        req.body.auction.valuationId = req.valuationId + "";

      if(req.body.auction._id){
        AuctionReq.update({_id:req.body.auction._id},{$set:req.body.auction},function(err,acts){
          if(err){return handleError(err,res)}
          else{
            self();
          }
        })
      }else{
        AuctionReq.create(req.body.auction,function(err,acts){
          if(err){return handleError(err,res)}
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
      auctionUpdate.auctionId = req.auctionId + "";
      if(req.valuationId)
        auctionUpdate.valuationId = req.valuationId + "";
      Product.update({_id:req.body.auction.product._id},{$set:{auction:auctionUpdate}},function(err,prds){
         if(err){return handleError(err,res)}
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

function handleError(res, err) {
  console.log(err);
  return res.status(500).send(err);
}