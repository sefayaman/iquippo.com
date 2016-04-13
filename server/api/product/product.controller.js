'use strict';

var _ = require('lodash');
var Seq = require('seq');
var trim = require('trim');
 var fs = require('fs');
 var gm = require('gm');
 var fsExtra = require('fs.extra');

var Product = require('./product.model');
var Product = require('./product.model');
var ProductHistory = require('./producthistory.model');

var User = require('./../user/user.model');
var Group = require('./../group/group.model');
var Category = require('./../category/category.model');
var SubCategory = require('./../category/subcategory.model');
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');

var config = require('./../../config/environment');
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
  if(req.body.searchstr){
    var arr = [];
    arr[arr.length] = { name: { $regex: term }};
    arr[arr.length] = { "group.name": { $regex: term }};
    arr[arr.length] = { "category.name": { $regex: term }};
    arr[arr.length] = { "model.name": { $regex: term }};
    arr[arr.length] = { "brand.name": { $regex: term }};
    filter['$or'] = arr;
  }
  if(req.body.location){
    var locRegEx = new RegExp(req.body.location, 'i');
    filter["city"] = {$regex:locRegEx};
  }
  if(req.body.tradeType){
   filter["tradeType"] = {$in:[req.body.tradeType,'BOTH']};
  }
    
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

// Updates an existing product in the DB.
exports.update = function(req, res) {
  req.isEdit = true;
  if(req.body.applyWaterMark){
      req.counter = 0;
      req.totalImages = req.body.images.length;
      checkAndCopyImage(req,res);
  }else{
    updateProduct(req,res)    
  }

};

// Creates a new product in the DB.
exports.create = function(req, res) {
  req.isEdit = false;
  if(req.body.applyWaterMark){
      req.counter = 0;
      req.totalImages = req.body.images.length;
      checkAndCopyImage(req,res);
  }else{
    addProduct(req,res)    
  }
};

function checkAndCopyImage(req,res){
   if(req.counter < req.totalImages){
      var imgObj = req.body.images[req.counter];
      var imgPath = config.uploadPath + req.body.assetDir + "/" + imgObj.src;
      if(imgObj.waterMarked)
      {
        req.counter ++;
        checkAndCopyImage(req,res);
      }else{
        var fileNameParts = imgObj.src.split('.');
        var extPart = fileNameParts[fileNameParts.length -1];
        var namePart = fileNameParts[0];
        var originalFilePath = config.uploadPath + req.body.assetDir + "/" + namePart +"_original." + extPart;
        if(fileExists(originalFilePath)){
            placeWatermark(req,res,imgPath);
        }else{
            fsExtra.copy(imgPath,originalFilePath,function(err,result){
              placeWatermark(req,res,imgPath);
            })
        }
      }

   }else{
      if(req.isEdit)
        updateProduct(req,res);
      else
        addProduct(req,res);  
   }
}

function placeWatermark(req,res,imgPath){
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
            req.body.images[req.counter].waterMarked = true;
            req.counter ++;
            checkAndCopyImage(req,res);
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
  if(req.body.seller) { delete req.body.seller; }
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
    range = {s: {c:0, r:0}, e: {c:35, r:data.length }};
  else
    range = {s: {c:0, r:0}, e: {c:21, r:data.length }};

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

    if(R == 0)
      cell = {v: "Seller email"};
    else {
      if(product && product.seller)
        cell = {v: product.seller.email};
    }
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
      cell = {v: "Sold (Y/N)"};
    else {
      if(product)
        cell = {v: isYorN(product.isSold)};
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
  //filter["status"] = true;
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
  importProducts(req,res,data);
}

function importProducts(req,res,data){
  if(req.counter < req.numberOfCount){
    var row = data[req.counter];
    var product = {};
    Seq()
    .seq(function(){
      var self = this;
       var categoryName = row["Category*"];
      if(!categoryName){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['message'] = "Field marked with * are mandatory.";
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
              errorObj['message'] = "Field marked with * are mandatory.";
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
          errorObj["message"] = "Category, Brand, Model relation does not exist in Master Data.";
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
        errorObj['message'] = "Field marked with * are mandatory";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;

      }
      brandName  = trim(brandName);
      if(product.category['name'] == "Other" && brandName != "Other"){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['message'] = "Field marked with * are mandatory.";
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
              errorObj['message'] = "Field marked with * are mandatory.";
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
          errorObj["message"] = "Category, Brand, Model relation does not exist in Master Data.";
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
        errorObj['message'] = "Field marked with * are mandatory";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
      }
      modelName  = trim(modelName);
      if(product.brand['name'] == "Other" && modelName != "Other"){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['message'] = "Field marked with * are mandatory.";
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
              errorObj['message'] = "Field marked with * are mandatory.";
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
      var sellerEmail = row["Seller_Email_Address*"];
       if(!sellerEmail){
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['message'] = "Field marked with * are mandatory";
        req.errors[req.errors.length] = errorObj;
        req.counter ++;
        importProducts(req,res,data);
        return;
      }
      sellerEmail = trim(sellerEmail)
       User.find({email:sellerEmail},function(err,usrs){
        if(err) return handleError(res, err); 
        if(usrs.length > 0){
         product.seller = {};
         product.seller["country"] = usrs[0]['country'];
         product.seller["email"] = usrs[0]['email'];
         product.seller["mobile"] = usrs[0]['mobile'];
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
          errorObj["message"] = "Seller email id is not found";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
        }
      })
    })
    .seq(function(){
        product["createdAt"] = new Date();
        product["updatedAt"] = new Date();
        product["relistingDate"] = new Date();
        var country = row["Country*"];
        if(!country){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['message'] = "Field marked with * are mandatory";
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
        if(!tradeType){
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['message'] = "Trade type is not found.";
          req.errors[req.errors.length] = errorObj;
          req.counter ++;
          importProducts(req,res,data);
          return;
        }
        product["tradeType"] = trim(tradeType);
        if(tradeType != "RENT") {
          var gp = row["Gross_Price*"];
          var prOnReq = trim(row["Price_on_Request*"]).toLowerCase();
          var cr = row["Currency*"];
          if(prOnReq == 'yes' || prOnReq == 'y') {
            product["priceOnRequest"] = true; 
          } else {
            product["priceOnRequest"] = false;
            if(gp && cr){
              product["grossPrice"] = Number(trim(gp));
              product["currencyType"] = trim(cr);
            } else {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['message'] = "Currency/Gross Price is not found. In case, price on request, please select Yes.";
              req.errors[req.errors.length] = errorObj;
              req.counter ++;
              importProducts(req,res,data);
              return;
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
          errorObj['message'] = "State is not found.";
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
          errorObj['message'] = "State is not found.";
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
          errorObj['message'] = " Manufacturing Year should be in YYYY format.";
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
          var fromDate = row["Availability_of_Asset_From"];
          if(!fromDate){
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['message'] = "Availability of asset from date is not found.";
            req.errors[req.errors.length] = errorObj;
            req.counter ++;
            importProducts(req,res,data);
            return;
          }
          product["rent"].fromDate = trim(fromDate);
          var toDate = row["Availability_of_Asset_To"];
          if(!fromDate){
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['message'] = "Availability of asset to date is not found.";
            req.errors[req.errors.length] = errorObj;
            req.counter ++;
            importProducts(req,res,data);
            return;
          }
          product["rent"].toDate = trim(toDate);
          //rent hours
          if(rateTypeH == "yes" || rateTypeH == 'y') {
            var minPeriodH = row["Min_Rental_Period_Hours"];
            if(!minPeriodH){
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['message'] = "Min rental period hours is not found.";
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
              errorObj['message'] = "Max rental period hours is not found.";
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
              errorObj['message'] = "Rent amount hours is not found.";
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
              errorObj['message'] = "Security deposi hours is not found.";
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
              errorObj['message'] = "Min rental period days is not found.";
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
              errorObj['message'] = "Max rental period days is not found.";
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
              errorObj['message'] = "Rent amount days is not found.";
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
              errorObj['message'] = "Security deposi days is not found.";
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
              errorObj['message'] = "Min rental period months is not found.";
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
              errorObj['message'] = "Max rental period months is not found.";
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
              errorObj['message'] = "Rent amount months is not found.";
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
              errorObj['message'] = "Security deposi months is not found.";
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

        req.successProductArr[req.successProductArr.length] = product;
        req.counter ++;
         importProducts(req,res,data);
    })

  }else{
    res.status(200).json({successList:req.successProductArr,errorList:req.errors});
  }
  
}

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

function handleError(res, err) {
  return res.status(500).send(err);
}