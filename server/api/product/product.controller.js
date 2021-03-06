'use strict';

var _ = require('lodash');
var Seq = require('seq');
var trim = require('trim');
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });
var fsExtra = require('fs.extra');
var lwip = require('lwip');
var Product = require('./product.model');
var ProductHistory = require('./producthistory.model');
var json2xls = require('json2xls');
var Utility = require('./../../components/utility.js');

var User = require('./../user/user.model');
var Group = require('./../group/group.model');
var Category = require('./../category/category.model');
var SubCategory = require('./../category/subcategory.model');
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');
var CityModel = require('../common/location.model');
var AssetSaleModel = require('./../assetsale/assetsalebid.model');
var TechSpecValMaster = require('./../techspec/techspecvalmaster.model.js');

var PaymentTransaction = require('./../payment/payment.model');
var PaymentMaster = require('../common/paymentmaster.model');
var Lot = require('../common/lot.model');
var ValuationReq = require('./../valuation/valuation.model');
var AuctionReq = require('./../auction/auction.model');
var AuctionMaster = require('./../auction/auctionmaster.model');
var VendorModel = require('../vendor/vendor.model');
var appNotificationCtrl = require('./../appnotification/appnotification.controller');

var config = require('./../../config/environment');
var IncomingProduct = require('./../../components/incomingproduct.model');
var xlsx = require('xlsx');
var Utillity = require('./../../components/utility');
var APIError = require('../../components/_error');
var importPath = config.uploadPath + config.importDir + "/";
var async = require('async');
var debug = require('debug')('api.product.controller');
var productFieldsMap = require('./../../config/product_temp_field_map');
var productInfoModel = require('../productinfo/productinfo.model');
var moment = require('moment');
var AssetSaleUtil = require('../assetsale/assetsaleutil');
var validDateFormat = ['DD/MM/YYYY', 'MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD', moment.ISO_8601];
var offerStatuses = ['Bid Received', 'Bid Changed', 'Bid Withdraw'];
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];
// Get list of products
exports.getAll = function (req, res) {
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  Product.find(filter, function (err, products) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(products);
  });
};

// for making sitemap url need this function excuted on server side
// exports.getAllProducts = function() {
//   return new Promise(function(reject, resolve) {
//     return Product.find({}, function (err, products) {
//       if(err) { reject(err); }
//       else{
//         for(var i=0; i<products.length; i++){
//           console.log(products.length);
//           resolve(products); 
//         }       
//       }
//     }); 
//   });
// };


// Get a single product
exports.getOnId = function (req, res) {
  Product.findById(req.params.id, function (err, product) {
    if (err) { return handleError(res, err); }
    if (!product) { return res.status(404).send('Not Found'); }
    return res.json(product);
  });
};
//incoming products

exports.incomingProduct = function (req, res) {
  var filter = {};
  if (req.body.role === 'admin') {
    filter = {};
  }
  else {
    filter["user._id"] = req.body.userId;
  }
  //console.log('role',req.body.role,'incomingproducts',filter);
  IncomingProduct.find(filter, function (err, products) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(products);
  });
};

exports.deleteIncomingProduct = function (req, res) {
  IncomingProduct.findOneAndRemove({ _id: req.body.productId }, function (err, dt) {
    if (err) { return handleError(res, err); }
    if (!dt) { res.status(404).json({ errorCode: 1 }); }
    else
      res.status(200).json({});
  })
}

exports.getIncomingProduct = function (req, res) {
  IncomingProduct.findOneAndUpdate({ _id: req.body.productId, lock: false }, { $set: { lock: true } }, function (err, dt) {
    if (err) { return handleError(res, err); }
    if (!dt) { return res.status(404).json({ errorCode: 1 }); }
    return res.status(200).json(dt);
  })
}

exports.unIncomingProduct = function (req, res) {
  IncomingProduct.update({ _id: req.body.productId }, { $set: { lock: false } }, function (err, dt) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(dt);
  })
}

//Set all seller related to a enterprise
exports.getSellers = function (req, res, next) {
  if (!req.body.enterpriseId)
    return next();
  req.sellers = [];
  User.find({ enterpriseId: req.body.enterpriseId, deleted: false, status: true }, function (err, sellers) {
    if (err || !sellers.length) {
      return next();
    }
    sellers.forEach(function (item) {
      req.sellers.push(item._id + "")
    });
    next();
  })
}

//search products
exports.search = function (req, res) {
  var term = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  //filter["status"] = true;
  filter["deleted"] = false;
  if (req.body.status)
    filter["status"] = req.body.status;
  if (req.body._id)
    filter["_id"] = req.body._id;

  if (req.body.statusText == "active")
    filter["status"] = true;
  if (req.body.statusText == "inactive")
    filter["status"] = false;

  if (req.body.featured)
    filter["featured"] = req.body.featured;
  var arr = [];
  if (req.body.searchstr) {

    arr[arr.length] = { name: { $regex: term } };
    arr[arr.length] = { "group.name": { $regex: term } };
    arr[arr.length] = { "group.otherName": { $regex: term } };
    arr[arr.length] = { "category.name": { $regex: term } };
    arr[arr.length] = { "category.otherName": { $regex: term } };
    arr[arr.length] = { "model.name": { $regex: term } };
    arr[arr.length] = { "model.otherName": { $regex: term } };
    arr[arr.length] = { "brand.name": { $regex: term } };
    arr[arr.length] = { "brand.otherName": { $regex: term } };
    arr[arr.length] = { country: { $regex: term } };
    arr[arr.length] = { city: { $regex: term } };
    arr[arr.length] = { state: { $regex: term } };
    arr[arr.length] = { assetStatus: { $regex: term } };
    arr[arr.length] = { tradeType: { $regex: term } };
    arr[arr.length] = { assetId: { $regex: term } };
    //arr[arr.length] = { grossPrice: { $regex: term }};
    arr[arr.length] = { "seller.fname": { $regex: term } };
    arr[arr.length] = { mfgYear: { $regex: term } };
  }

  if (req.body.groupStr) {
    var gpRegex = new RegExp(req.body.groupStr, 'i');
    arr[arr.length] = { "group.name": { $regex: gpRegex } };
    arr[arr.length] = { "group.otherName": { $regex: gpRegex } };
  }

  if (req.body.categoryStr) {
    var ctRegex = new RegExp(req.body.categoryStr, 'i');
    arr[arr.length] = { "category.name": { $regex: ctRegex } };
    arr[arr.length] = { "category.otherName": { $regex: ctRegex } };
  }

  if (req.body.brandStr) {
    var brRegex = new RegExp(req.body.brandStr, 'i');
    arr[arr.length] = { "brand.name": { $regex: brRegex } };
    arr[arr.length] = { "brand.otherName": { $regex: brRegex } };

  }

  if (req.body.modelStr) {
    var mdRegex = new RegExp(req.body.modelStr, 'i');
    arr[arr.length] = { "model.name": { $regex: mdRegex } };
    arr[arr.length] = { "model.otherName": { $regex: mdRegex } };
  }

  if (req.body.sellerName)
    filter["seller.fname"] = { $regex: new RegExp(req.body.sellerName, 'i') };
  if (req.body.productCondition)
    filter["productCondition"] = { $regex: new RegExp(req.body.productCondition, 'i') };

  var locationArr = [];
  if (req.body.location) {
    var locRegEx = new RegExp(req.body.location, 'i');
    locationArr[locationArr.length] = { city: { $regex: locRegEx } };
    locationArr[locationArr.length] = { state: { $regex: locRegEx } };
    locationArr[locationArr.length] = { country: { $regex: locRegEx } };
  }

  if (req.body.productDescription) {
    var pdRegEx = new RegExp(req.body.productDescription, 'i');
    arr[arr.length] = { name: { $regex: pdRegEx } };
    arr[arr.length] = { assetId: { $regex: pdRegEx } };
  }

  if (req.body.cityName) {
    var cityRegex = new RegExp(req.body.cityName, 'i');
    filter['city'] = { $regex: cityRegex };
  }

  if (req.body.stateName) {
    var stateRegex = new RegExp(req.body.stateName, 'i');
    filter['state'] = { $regex: stateRegex };
  }

  if (req.body.productName) {
    var pdNameRegex = new RegExp(req.body.productName, 'i');
    arr[arr.length] = { name: { $regex: pdNameRegex } };
    arr[arr.length] = { assetId: { $regex: pdNameRegex } };
  }
  if (req.body.tradeType) {
    if (req.body.tradeType != "NOT_AVAILABLE")
      filter["tradeType"] = { $in: [req.body.tradeType, 'BOTH'] };
    else
      filter["tradeType"] = req.body.tradeType;
  }
  if (req.body.tradeValue)
    filter["tradeType"] = { $regex: new RegExp(req.body.tradeValue, 'i') };
  if (req.body.assetStatus)
    filter["assetStatus"] = { $regex: new RegExp(req.body.assetStatus, 'i') };
  if (req.body.assetIdEx)
    filter["assetId"] = req.body.assetIdEx;
  if (req.body.assetId)
    filter["assetId"] = { $regex: new RegExp(req.body.assetId, 'i') };
  if (req.body.assetIds && req.body.assetIds.length > 0)
    filter["assetId"] = { $in: req.body.assetIds };
  if (req.body.assetIdEx)
    filter["assetId"] = req.body.assetIdEx;
  if (req.body.group)
    filter["group.name"] = req.body.group;
  if (req.body.category)
    filter["category.name"] = req.body.category;
  if (req.body.subCategory)
    filter["subcategory.name"] = req.body.subCategory;
  if (req.body.brand)
    filter["brand.name"] = req.body.brand;
  if (req.body.model)
    filter["model.name"] = req.body.model;
  if (req.body.operatingHour)
    filter["operatingHour"] = req.body.operatingHour;
  if (req.body.mileage)
    filter["mileage"] = req.body.mileage;
  if (req.body.country)
    filter["country"] = req.body.country;
  if (req.body.certificationName)
    filter["certificationName"] = req.body.certificationName;
  var currencyFilter = {};
  var isCFilter = false;
  if (req.body.currency && req.body.currency.type) {
    if (req.body.currency.min) {
      currencyFilter['$gte'] = req.body.currency.min;
      isCFilter = true;
    }
    if (req.body.currency.max) {
      currencyFilter['$lte'] = req.body.currency.max;
      isCFilter = true;
    }
  }
  if (isCFilter) {
    filter["currencyType"] = req.body.currency.type;
    filter["grossPrice"] = currencyFilter;
  }

  if (req.body.mfgYear) {
    var mfgYear = false;
    var mfgFilter = {};
    if (req.body.mfgYear.min) {
      mfgFilter['$gte'] = req.body.mfgYear.min;
      mfgYear = true;
    }
    if (req.body.mfgYear.max) {
      mfgFilter['$lte'] = req.body.mfgYear.max;
      mfgYear = true;
    }
    if (mfgYear)
      filter["mfgYear"] = mfgFilter;
  }

  if (req.body.mfgYearMax || req.body.mfgYearMin) {
    var mfgFilter = {};
    if (req.body.mfgYearMin) {
      mfgFilter['$gte'] = req.body.mfgYearMin;
    }
    if (req.body.mfgYearMax) {
      mfgFilter['$lte'] = req.body.mfgYearMax;
    }
    filter["mfgYear"] = mfgFilter;
  }

  if (req.body.categoryId)
    filter["category._id"] = req.body.categoryId;

  if (req.sellers && req.sellers.length)
    filter["seller._id"] = { $in: req.sellers };
  if (req.sellers && req.sellers.length && req.defaultPartner)
    filter["seller._id"] = { $nin: req.sellers };
  if (req.body.bidRequestApproved && req.body.bidRequestApproved === 'y')
    filter.bidRequestApproved = true;
  if (req.body.bidRequestApproved && req.body.bidRequestApproved === 'n')
    filter.bidRequestApproved = false;
  if (req.body.bidReceived)
    filter.bidReceived = true;
  if (req.body.productCondition)
    filter.productCondition = req.body.productCondition;
  if (req.body.role && req.body.userid) {
    var usersArr = [req.body.userid];
    fetchUsers(req.body.userid, function (data) {
      if (data && data.length) {
        data.forEach(function (x) {
          usersArr.push(x._id.toString());
        })
      }
      arr[arr.length] = { "seller._id": { "$in": usersArr } };
      fetchResults();
    })
  } else if (req.body.userid) {
    filter["seller._id"] = req.body.userid;
    fetchResults();
  } else {
    fetchResults();
  }

  function fetchResults() {
    if (arr.length > 0 && locationArr.length > 0)
      filter['$and'] = [{ $or: arr }, { $or: locationArr }];
    else if (arr.length > 0)
      filter['$or'] = arr;
    else if (locationArr.length > 0)
      filter['$or'] = locationArr;

    var result = {};
    if (req.body.pagination) {
      paginatedProducts(req, res, filter, result);
      return;
    }
    var maxItem = 600;
    if (req.body.maxItem)
      maxItem = req.body.maxItem;

    var sortObj = {};
    if (req.body.sort)
      sortObj = req.body.sort;
    sortObj['createdAt'] = -1;

    var query = Product.find(filter).lean().sort(sortObj).limit(maxItem);
    Seq()
      .par(function () {
        var self = this;
        if (!req.query.count)
          return self();
        Product.count(filter, function (err, counts) {
          result.totalItems = counts;
          self(err);
        })
      })
      .par(function () {
        var self = this;
        if (req.query.count)
          return self();

        var assetIdCache = {};
        query.exec(function (err, products) {
          if (err) { return handleError(res, err); }
          var saleFeaturedProdWithPrice = [],
            saleFeaturedProdWithoutPrice = [],
            bothFeaturedProdWithPrice = [],
            bothFeaturedProdWithoutPrice = [],
            rentFeaturedProd = [],
            saleProdWithPrice = [],
            bothProdWithPrice = [],
            saleProdWithoutPrice = [],
            bothProdWithoutPrice = [],
            rentProdWithPrice = [],
            rentProdWithoutPrice = [],
            notAvailProd = [],
            soldProd = [],  //status of product
            rentedProd = [], //status
            remainingProd = [];
          products.forEach(function (item) {
            //item = item.toObject();
            //calculate total parking charge
            var todayDate = moment().daysInMonth();
            var repoDate = moment(item.repoDate);
            var a = moment(repoDate, 'DD/MM/YYYY');
            var b = moment(todayDate, 'DD/MM/YYYY');
            var days = b.diff(a, 'days') + 1;
            item.ageingOfAsset = days;
            item.parkingCharges = days * item.parkingChargePerDay;

            if (!assetIdCache[item.assetId]) {
              assetIdCache[item.assetId] = true;

              if (item.assetStatus === 'sold') {
                soldProd.push(item);
                return;
              }

              if (item.assetStatus === 'rented') {
                rentedProd.push(item);
                return;
              }

              if (item.tradeType === 'NOT_AVAILABLE') {
                notAvailProd.push(item);
                return;
              }

              if (item.featured && item.tradeType === 'SELL' && !item.priceOnRequest) {
                saleFeaturedProdWithPrice.push(item);
                return;
              }


              if (item.featured && item.tradeType === 'SELL') {
                saleFeaturedProdWithoutPrice.push(item);
                return;
              }

              if (item.featured && item.tradeType === 'BOTH' && !item.priceOnRequest) {
                bothFeaturedProdWithPrice.push(item);
                return;
              }

              if (item.featured && item.tradeType === 'BOTH') {
                bothFeaturedProdWithoutPrice.push(item);
                return;
              }

              if (item.featured && item.tradeType === 'RENT') {
                rentFeaturedProd.push(item);
                return;
              }

              if (item.tradeType === 'SELL' && !item.priceOnRequest) {
                saleProdWithPrice.push(item);
                return;
              }

              if (item.tradeType === 'BOTH' && !item.priceOnRequest) {
                bothProdWithPrice.push(item);
                return;
              }

              if (item.tradeType === 'RENT' && isRentWithPrice(item)) {
                rentProdWithPrice.push(item);
                return;
              }

              if (item.tradeType === 'SELL') {
                saleProdWithoutPrice.push(item);
                return;
              }

              if (item.tradeType === 'BOTH') {
                bothProdWithoutPrice.push(item);
                return;
              }

              if (item.tradeType === 'RENT') {
                rentProdWithoutPrice.push(item);
                return;
              }
              remainingProd.push(item);
            }
          });
          var outputProds = [].concat(saleFeaturedProdWithPrice, saleFeaturedProdWithoutPrice, bothFeaturedProdWithPrice, bothFeaturedProdWithoutPrice, rentFeaturedProd, saleProdWithPrice, bothProdWithPrice, rentProdWithPrice, saleProdWithoutPrice, bothProdWithoutPrice, rentProdWithoutPrice, notAvailProd, soldProd, rentedProd, remainingProd);
          result.products = outputProds;
          self();
        }

        );

        function isRentWithPrice(item) {
          if (!item.rent)
            return false;
          else if ((item.rent.rateHours && item.rent.rateHours.rentAmountH) || (item.rent.rateMonths && item.rent.rateMonths.rentAmountM) || (item.rent.rateDays && item.rent.rateDays.rentAmountD))
            return true;
          else
            return false;
        }
      })
      .seq(function () {
        if (req.query.count)
          return res.status(200).json(result.totalItems);
        res.setHeader('Cache-Control', 'private,max-age=2592000');
        return res.status(200).json(result.products);
      })
  }


};


function paginatedProducts(req, res, filter, result) {

  var pageSize = req.body.itemsPerPage || 50;
  var first_id = req.body.first_id;
  var last_id = req.body.last_id;
  var currentPage = req.body.currentPage || 1;
  var prevPage = req.body.prevPage || 0;
  var isNext = currentPage - prevPage >= 0 ? true : false;
  Seq()
    .par(function () {
      var self = this;
      Product.count(filter, function (err, counts) {
        result.totalItems = counts;
        self(err);
      })
    })
    .par(function () {

      var self = this;
      var sortFilter = { _id: -1 };
      if (last_id && isNext) {
        filter['_id'] = { '$lt': last_id };
      }
      if (first_id && !isNext) {
        filter['_id'] = { '$gt': first_id };
        sortFilter['_id'] = 1;
      }

      var query = null;
      var skipNumber = currentPage - prevPage;
      if (skipNumber < 0)
        skipNumber = -1 * skipNumber;

      query = Product.find(filter).lean().sort(sortFilter).limit(pageSize * skipNumber);
      query.exec(function (err, products) {
        if (!err && products.length > pageSize * (skipNumber - 1)) {
          result.products = products.slice(pageSize * (skipNumber - 1), products.length);
        } else
          result.products = [];
        if (!isNext && result.products.length > 0)
          result.products.reverse();
        self(err);
      });

    })
    .seq(function () {
      return res.status(200).json(result);
    })
    .catch(function (err) {
      console.log("######", err);
      handleError(res, err);
    })

}

//bulk product update
exports.bulkUpdate = function (req, res) {
  var bodyData = req.body;
  var dataToSet = {};
  dataToSet.updatedAt = new Date();
  switch (bodyData.action) {
    case 'delete':
      dataToSet.deleted = true;
    case 'deactive':
      dataToSet.status = false;
      //dataToSet.featured = false;
      Product.update({ _id: { "$in": bodyData.selectedIds } }, { $set: dataToSet }, { multi: true }, function (err, product) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json({});
      });
      break;
    case 'priceonrequest':
      dataToSet.priceOnRequest = true;
      Product.update({ _id: { "$in": bodyData.selectedIds }, tradeType: { $ne: 'RENT' } }, { $set: dataToSet }, { multi: true }, function (err, product) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json({});
      });
      break;
    case 'active':
      req.prdCounter = 0;
      req.totalPrd = bodyData.selectedIds.length;
      bulkActive(req, res);
      break;
    default:
      return res.status(404).send('Not Found');
  }
}

function bulkActive(req, res) {
  if (req.prdCounter < req.totalPrd) {
    var id = req.body.selectedIds[req.prdCounter];
    Product.findById(id, function (err, product) {
      if (err) { return handleError(res, err) }
      else {
        req.imgCounter = 0;
        req.totalImages = product.images.length;
        req.images = product.images;
        req.assetDir = product.assetDir;
        req.product = product;
        checkAndCopyImage(req, res, singleProductActive);
        //singleProductUpload(req,res,prdoduct);
      }

    })
  } else {
    return res.status(200).json({});
  }
}

function singleProductActive(req, res) {
  var product = req.product;
  var productId = product._id;
  if (product._id) { delete product._id; }
  product.status = true;
  Product.update({ _id: productId }, { $set: product }, function (err) {
    if (err) { return handleError(res, err); }
    req.prdCounter++;
    bulkActive(req, res);
    //return res.status(200).json(req.body);
  });
}

//Validate update product

exports.validateUpdate = function (req, res, next) {
  if (req.body.tradeType !== 'RENT')
    return next();

  var _id = req.body._id;
  var filter = {};
  filter['product.proData'] = _id;
  filter.offerStatus = offerStatuses[0];
  AssetSaleModel.find(filter, function (err, resultArr) {
    if (err) return next(err);
    if (resultArr.length) return next(new APIError(409, 'There is active bid for this product'));
    next();
  });

}

//pre creation process

exports.getTechSpec = function (req, res, next) {
  var queryParam = req.body;
  if (queryParam.productCondition === "used")
    return next();

  var filter = {};
  if (queryParam.category._id)
    filter['category.categoryId'] = queryParam.category._id;
  if (queryParam.brand._id)
    filter['brand.brandId'] = queryParam.brand._id;
  if (queryParam.model._id)
    filter['model.modelId'] = queryParam.model._id;

  var query = TechSpecValMaster.find(filter);

  query.exec(function (err, result) {
    if (err)
      return res.status(500).send(err);
    req.body.techSpec = [];
    if (result.length === 1) {
      result[0].fields.forEach(function (item) {
        if (item && item.isFront && req.body.techSpec.length < 3) {
          var dataObj = {};
          dataObj.name = item.name;
          dataObj.value = item.value;
          dataObj.priority = item.priority || 0;
          req.body.techSpec[req.body.techSpec.length] = dataObj;
        }
      });
      return next();
    }
    return next();
  });
}

exports.calculatePrice = function (req, res, next) {
  if (req.body.tradeType === 'RENT')
    return next();

  if (!req.body.grossPrice && !req.body.reservePrice && !req.body.valuationAmount) {
    req.body.priceOnRequest = true;
    return next();
  }

  if (req.body.reservePrice) {
    req.body.grossPrice = req.body.reservePrice;
    return next();
  }

  if (req.body.seller && req.body.valuationAmount) {
    AssetSaleUtil.getMasterBasedOnUser(req.body.seller._id, {}, 'markup', function (err, result) {
      if (err)
        return res.status(500).send(err);

      var markupPercent = 0;
      if (result && result.length)
        markupPercent = result[0].price || 0;

      var buyNowPrice = Number(req.body.valuationAmount || 0) + (Number(req.body.valuationAmount || 0) * Number(markupPercent || 0) / 100);
      req.body.grossPrice = Math.round(buyNowPrice || 0);
      return next();
    });
  } else if (req.body.grossPrice)
    return next();
  else
    return res.status(412).send('Unable to process your request.Please contact support team.');
}


// Updates an existing product in the DB.
exports.update = function (req, res) {
  req.isEdit = true;
  if (req.body.applyWaterMark) {
    req.imgCounter = 0;
    req.totalImages = req.body.images.length;
    req.images = req.body.images;
    req.assetDir = req.body.assetDir;
    checkAndCopyImage(req, res, null);
  } else {
    updateProduct(req, res)
  }
};

// resubmit to auction an existing product in the DB.
exports.sendReqToCreateAsset = function (req, res) {
  var options = {};
  options.dataToSend = {};
  var auctionReqId = req.body.assetReqId;
  if (req.body.assetReqId)
    delete req.body.assetReqId;
  options.dataToSend = req.body;
  options.dataType = "assetData";

  Utillity.sendCompiledData(options, function (err, result) {
    if (err || (result && result.err)) {
      options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
      //options.dataToSend.status = false;
      update(options.dataToSend);
      AuctionReq.update({ _id: auctionReqId }, { $set: { "reqSubmitStatus": options.dataToSend.reqSubmitStatus } }).exec();
      return res.status(201).json({ errorCode: 1, message: "Unable to post asset request. Please contact support team." });
    }
    if (result) {
      options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
      //options.dataToSend.status = true;
      update(options.dataToSend);
      AuctionReq.update({ _id: auctionReqId }, { $set: { "reqSubmitStatus": options.dataToSend.reqSubmitStatus } }).exec();
      return res.status(201).json({ errorCode: 0, message: "Product request submitted successfully !!!" });
    }
  });
};

// Creates a new product in the DB.
exports.create = function (req, res) {
  req.isEdit = false;
  Product.find({ assetId: req.body.assetId }, function (err, pds) {
    if (err) { return handleError(res, err); }
    else if (pds.length > 0) {
      return res.status(404).json({ errorCode: 1, message: "Data already exist with this asset Id!" });
    } else {
      if (req.body.applyWaterMark) {
        req.imgCounter = 0;
        req.totalImages = req.body.images.length;
        req.images = req.body.images;
        req.assetDir = req.body.assetDir;
        checkAndCopyImage(req, res, null);
      } else {
        addProduct(req, res)
      }
    }
  });
};

function checkAndCopyImage(req, res, cb) {

  if (req.imgCounter < req.totalImages) {
    var imgObj = req.images[req.imgCounter];
    var imgPath = config.uploadPath + req.assetDir + "/" + imgObj.src;
    if (imgObj.waterMarked) {
      req.imgCounter++;
      checkAndCopyImage(req, res, cb);
    } else {
      placeWatermark(req, res, imgPath, cb);
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
  } else {
    if (cb)
      cb(req, res);
    else {
      if (req.isEdit)
        updateProduct(req, res);
      else
        addProduct(req, res);
    }
  }
}

function placeWatermark(req, res, imgPath, cb) {
  var waterMarkWidth = 144;
  var waterMarkHeight = 86;
  try {
    var imgRef = gm(imgPath);
    imgRef.size(function (err, val) {
      if (err) {
        req.images[req.imgCounter].waterMarked = false;
        req.imgCounter++;
        checkAndCopyImage(req, res, cb);
        return;
        //return handleError(res, err);
      }
      var ptx = val.width - waterMarkWidth;
      var pty = val.height - waterMarkHeight;
      var args = 'image Over ' + ptx + ',' + pty + ' 0,0 "' + config.uploadPath + '../images/watermark.png"';
      imgRef.draw([args])
        .write(imgPath, function (e) {
          if (e) {
            return handleError(res, err);
          }
          req.images[req.imgCounter].waterMarked = true;
          req.imgCounter++;
          checkAndCopyImage(req, res, cb);
        });
    })
  } catch (e) {
    console.log("exception------", e);
    req.images[req.imgCounter].waterMarked = false;
    req.imgCounter++;
    checkAndCopyImage(req, res, cb);
    return;
    //return handleError(res, err);
  }
}

function updateProduct(req, res) {
  if (req.body._id) { delete req.body._id; }
  if (req.body.userInfo) { delete req.body.userInfo; }
  //if(req.body.seller) { delete req.body.seller; }
  req.body.updatedAt = new Date();
  Product.findById(req.params.id, function (err, product) {
    if (err) { return handleError(res, err); }
    if (!product) { return res.status(404).send('Not Found'); }
    req.body.featured = false;
    delete req.body.featured;
    req.proData = product.toObject();
    
    if ( req.body.tradeType && req.body.tradeType.toLowerCase()==='sell' && req.body.bidRequestApproved) {
            console.log(req.body.assetId);
            var filter = {};
            filter['product.assetId'] = req.body.assetId;
            filter['bidStatus'] = 'Accepted';
            AssetSaleModel.find(filter,function(err,bids){
                if(err)
                  return handleError(res, err);

                if(bids && bids.length){
                    return res.status(404).send("Asset Trade Type can't be modified as there is an active bid on it");    
                } 
                else {return updateProductData();}
            });
        } else if (req.body.featured) {
            var imgPath = config.uploadPath + req.body.assetDir + "/" + req.body.primaryImg;
            var featureFilePath = config.uploadPath + "featured/" + req.body.primaryImg;
            var fileParts = req.body.primaryImg.split('.');
            var extPart = fileParts[1];
            var fileBeforeCompression = 1;
            var fileAfterCompression = 0;
            if (fs.existsSync(featureFilePath)) {
                return updateProductData();
            }

            fsExtra.copy(imgPath, featureFilePath, {
                replace: false
            }, function (err, result) {
                if (err) {
                    return updateProductData();
                }
                lwip.open(featureFilePath, function (err, image) {
                    if (err) {
                        return updateProductData();
                    }
                    var stats = fs.statSync(featureFilePath);
                    fileBeforeCompression = stats.size;
                    image.resize(130, 100, function (err, rzdImage) {
                        if (err) {
                            return updateProductData();
                        }
                        if (extPart.toLowerCase() === 'jpg' || extPart.toLowerCase() === 'jpeg') {
                            rzdImage.toBuffer(extPart, {
                                quality: 75
                            }, function (err, buffer) {
                                if (err) {
                                    return updateProductData();
                                }
                                fs.writeFile(featureFilePath, buffer, function (err) {
                                    if (err) {
                                        return updateProductData();
                                    }
                                    var stats = fs.statSync(featureFilePath);
                                    fileAfterCompression = stats.size;
                                    debug("SIZE After compression", fileAfterCompression);
                                    return updateProductData();
                                });
                            });
                        } else {
                            if (extPart === 'png') {
                                rzdImage.toBuffer(extPart, {
                                    compression: "high",
                                    interlaced: false,
                                    transparency: 'auto'
                                }, function (err, buffer) {
                                    if (err) {
                                        return updateProductData();
                                    }
                                    fs.writeFile(featureFilePath, buffer, function (err) {
                                        if (err) {
                                            return updateProductData();
                                        }
                                        var stats = fs.statSync(featureFilePath);
                                        fileAfterCompression = stats.size;
                                        return updateProductData();
                                    });
                                });
                            }
                        }
                    });
                });
            });
        } else {
            updateProductData();
        }
    

    function updateProductData() {
      Product.update({ _id: req.params.id }, { $set: req.body }, function (err) {
        if (err) { return handleError(res, err); }
        if (req.body.tradeType === 'SELL' && req.body.auctionListing) {
          if (req.body.deleted) {
            AuctionReq.update({ _id: req.proData.auction._id }, { $set: { "isDeleted": true } }, function (aucErr, resultData) {
              if (aucErr)
                return handleError(res, err);
            });
          }
          req.body._id = req.params.id;
          postRequest(req, res);
        } else if (req.proData.auctionListing && (!req.body.auctionListing || req.body.tradeType === 'NOT_AVAILABLE')) {
          if (req.body.assetMapData)
            delete req.body.assetMapData;
          AuctionReq.update({ _id: req.proData.auction._id }, { $set: { "isDeleted": true } }, function (aucErr, resultData) {
            if (aucErr)
              return handleError(res, err);
            req.body._id = req.params.id;
            postRequest(req, res);
          });
        } else
          return res.status(200).json({ product: req.body });
      });
    }
  });
}

function addProduct(req, res) {
  req.body.createdAt = new Date();
  req.body.relistingDate = new Date();
  req.body.updatedAt = new Date();
  req.body.featured = false;

  if (req.body.featured) {
    var imgPath = config.uploadPath + req.body.assetDir + "/" + req.body.primaryImg;
    var featureFilePath = config.uploadPath + "featured/" + req.body.primaryImg;
    //console.log("featureFilePath----",featureFilePath);
    var fileParts = req.body.primaryImg.split('.');
    var extPart = fileParts[1];
    var fileBeforeCompression = 1;
    var fileAfterCompression = 0;
    var counter = 0;
    if (fs.existsSync(featureFilePath)) {
      return;
    }
    fsExtra.copy(imgPath, featureFilePath, {
      replace: false
    }, function (err, result) {
      if (err) throw err;
      lwip.open(featureFilePath, function (err, image) {
        var stats = fs.statSync(featureFilePath);
        fileBeforeCompression = stats.size;
        debug("SIZE before compression", fileBeforeCompression);
        image.resize(130, 100, function (err, rzdImage) {
          if (extPart.toLowerCase() === 'jpg' || extPart.toLowerCase() === 'jpeg') {
            rzdImage.toBuffer(extPart, {
              quality: 75
            }, function (err, buffer) {
              fs.writeFile(featureFilePath, buffer, function (err) {
                if (err) throw err;
                var stats = fs.statSync(featureFilePath);
                fileAfterCompression = stats.size;
                debug("SIZE After compression", fileAfterCompression);
                counter++;
              })
            })
          } else {
            if (extPart == 'png') {
              rzdImage.toBuffer(extPart, {
                compression: "high",
                interlaced: false,
                transparency: 'auto'
              }, function (err, buffer) {
                fs.writeFile(featureFilePath, buffer, function (err) {
                  if (err) throw err;
                  var stats = fs.statSync(featureFilePath);
                  fileAfterCompression = stats.size;
                  console.log("SIZE After compression", fileAfterCompression);
                  counter++;
                })
              })
            }
          }
        })
      })
    })
  }

  Product.create(req.body, function (err, product) {
    if (err) { return handleError(res, err); }
    if ((product.tradeType === 'SELL' || product.tradeType === 'BOTH') && product.auctionListing) {
      req.body._id = product._id;
      if (!req.body.assetId)
        req.body.assetId = product.assetId;
      postRequest(req, res);
    }
    else
      return res.status(201).json({ product: product });
  });
}

function postRequest(req, res) {
  var options = {};
  
  Product.find({
    _id: req.body._id
  }, function (err, proResult) {
    var proResult = proResult[0].toObject();
    options.dataToSend = {};
    if (req.body.assetMapData)
      options.dataToSend = req.body.assetMapData;
    else
      options.dataToSend.isDeleted = true;
    options.dataToSend._id = req.body._id;
    options.dataToSend.assetId = req.body.assetId;
    options.dataType = "assetData";
    if (options.dataToSend.createdBy)
      delete options.dataToSend.createdBy;
    if (req.body.assetMapData && req.body.assetMapData.auctionType==='PT') {
        options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
        proResult.reqSubmitStatus = ReqSubmitStatuses[0];
        update(options.dataToSend);
        if (req.body.auction && req.body.auction._id)
          AuctionReq.update({ _id: req.body.auction._id }, { $set: { "reqSubmitStatus": options.dataToSend.reqSubmitStatus } }).exec();
        return res.status(201).json({ errorCode: 0, message: "Product request submitted successfully !!!", product: proResult });
    }
    else {
        Utillity.sendCompiledData(options, function (err, result) {
          if (err || (result && result.err)) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[1];
            proResult.reqSubmitStatus = ReqSubmitStatuses[1];
            //options.dataToSend.status = false;
            update(options.dataToSend);
            if (req.body.auction && req.body.auction._id)
              AuctionReq.update({ _id: req.body.auction._id }, { $set: { "reqSubmitStatus": options.dataToSend.reqSubmitStatus } }).exec();
            // if(result && result.err) {}
            //     return res.status(412).send(result.err);
            //return res.status(412).json("Unable to post asset request. Please contact support team.");
            return res.status(201).json({ errorCode: 1, message: "Unable to post asset request. Please contact support team.", product: proResult });
          }
          if (result) {
            options.dataToSend.reqSubmitStatus = ReqSubmitStatuses[0];
            proResult.reqSubmitStatus = ReqSubmitStatuses[0];
            //options.dataToSend.status = true;
            update(options.dataToSend);
            if (req.body.auction && req.body.auction._id)
              AuctionReq.update({ _id: req.body.auction._id }, { $set: { "reqSubmitStatus": options.dataToSend.reqSubmitStatus } }).exec();
            return res.status(201).json({ errorCode: 0, message: "Product request submitted successfully !!!", product: proResult });
          }
        });
    }
  });
}

function update(assetReq) {
  var id = assetReq._id;
  delete assetReq._id;
  Product.update({ _id: id, deleted: false }, { $set: { "reqSubmitStatus": assetReq.reqSubmitStatus } }, function (err, retVal) {
    if (err) { console.log("Error with updating auction request"); }
    console.log("Product Updated");
  });
}

// Updates an existing expiry product in the DB.
exports.setExpiry = function (req, res) {
  var ids = req.body;
  var obj = {};
  obj['updatedAt'] = new Date();
  obj['status'] = false;
  //obj['featured'] = false;
  obj['expired'] = true;
  Product.update({ _id: { "$in": ids } }, { $set: obj }, { multi: true }, function (err, product) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(product);
  });

};

exports.updateInquiryCounter = function (req, res) {
  var ids = req.body;
  Product.update({ _id: { $in: ids } }, { $inc: { inquiryCounter: 1 } }, { multi: true }, function (err, data) {
    res.status(200).send('');
  });
}
// Deletes a product from the DB.
exports.destroy = function (req, res) {
  Product.findById(req.params.id, function (err, product) {
    if (err) { return handleError(res, err); }
    if (!product) { return res.status(404).send('Not Found'); }
    product.remove(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.countryWiseProductCount = function (req, res) {
  Product.aggregate(
    {
      $match: {
        status: true,
        deleted: false
      }
    },
    {
      $group:
        { _id: '$country', total_products: { $sum: 1 } }
    },
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}
exports.categoryWiseCount = function (req, res) {
  var filter = {};
  filter['deleted'] = false;
  filter['status'] = true;
  if (req.body.categoryIds)
    filter['category._id'] = { $in: req.body.categoryIds };
  Product.aggregate(
    { $match: filter },
    {
      $group:
        { _id: '$category._id', count: { $sum: 1 } }
    },
    { $sort: { count: -1 } },
    function (err, result) {
      if (err) return handleError(err);
      res.setHeader('Cache-Control', 'private, max-age=2592000');
      return res.status(200).json(result);
    }
  );
}

exports.statusWiseCount = function (req, res) {
  var filter = {};
  filter['deleted'] = false;
  filter['status'] = true;
  Product.aggregate(
    { $match: filter },
    {
      $group:
        { _id: '$assetStatus', count: { $sum: 1 } }
    },
    { $sort: { count: -1 } },
    function (err, result) {
      if (err) return handleError(err);
      Product.count({ deleted: false }, function (err, count) {
        if (!err) {
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

exports.userWiseProductCount = function (req, res) {
  var filter = {};
  filter['deleted'] = false;
  if (req.body.userId)
    filter["seller._id"] = req.body.userId;
  Product.aggregate(
    { $match: filter },
    {
      $group:
        { _id: '$assetStatus', total_assetStatus: { $sum: 1 } }
    },
    function (err, result) {
      if (err) return handleError(err);
      filter['assetStatus'] = 'listed';
      Product.aggregate(
        { $match: filter },
        {
          $group:
            { _id: '$tradeType', total_tradeType: { $sum: 1 } }
        },
        function (err, data) {
          if (err) return handleError(err);
          result = result.concat(data);
          delete filter.assetStatus;
          Product.aggregate(
            { $match: filter },
            {
              $group:
                { _id: 'inquiryCount', inquiryCount: { $sum: '$inquiryCounter' } }
            },
            function (err, inCount) {
              if (err) return handleError(err);
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
exports.createHistory = function (req, res) {
  req.body.createdAt = new Date();
  req.body.relistingDate = new Date();
  req.body.updatedAt = new Date();
  ProductHistory.create(req.body, function (err, product) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(product);
  });
};

//search based on productId
exports.getHistory = function (req, res) {
  //var term = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  filter["history.deleted"] = false;
  if (req.body.productId)
    filter["history.productId"] = req.body.productId;

  var query = ProductHistory.find(filter);
  query.exec(
    function (err, product) {
      if (err) { return handleError(res, err); }
      res.setHeader('Cache-Control', 'private, max-age=2592000');
      return res.status(200).json(product);
    }
  );
};


function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function fetchUsers(id, cb) {
  User.find({ 'createdBy._id': id }, function (err, results) {
    if (err) {
      console.log(err);
      return cb();
    }
    return cb(results);
  })
}

//export data into excel
exports.exportProducts = function (req, res) {
  var filter = {};
  //filter["status"] = true;
  filter["deleted"] = false;
  if (req.body.productCondition)
    filter.productCondition = req.body.productCondition;
  if (req.body.userid && req.body.role !== 'admin') {
    if (req.body.role == "channelpartner") {
      var usersArr = [req.body.userid];
      fetchUsers(req.body.userid, function (data) {
        if (data && data.length) {
          data.forEach(function (x) {
            usersArr.push(x._id.toString());
          })
        }
        filter["seller._id"] = {
          "$in": usersArr
        }
        fetchResults();
      })
    } else if (req.user.role === 'enterprise' && req.user.enterprise) {
      filter["seller._id"] = {
        "$in": req.sellers || []
      }
      return fetchResults();
    } else {
      filter["seller._id"] = req.body.userid;
      fetchResults();
    }
  } else {
    fetchResults();
  }

  function fetchResults() {

    var query = Product.find(filter).sort({
      _id: 1
    });
    query.lean().exec(
      function (err, products) {
        if (err) {
          return handleError(res, err);
        }
        var responseData = [];
        var mapedFields = {};
        var extraCols = ['priceOnRequest', 'auctionListing', 'isEngineRepaired', 'dispSellerContact', 'dispSellerAlternateContact', 'featured', 'status'];
        Object.keys(productFieldsMap).forEach(function (x) {
          mapedFields[productFieldsMap[x]] = x;
        });
        products.forEach(function (x) {
          var colData = x;//._doc;
          var obj = {};
          if (colData && Object.keys(colData).length) {
            Object.keys(colData).forEach(function (y) {
              if (mapedFields[y] && (extraCols.indexOf(y) < 0)) {
                if (x[y])
                  obj[mapedFields[y]] = x[y];
                ['category', 'brand', 'model', 'group'].forEach(function (u) {
                  if (x[u])
                    obj[mapedFields[u]] = x[u].name;
                });
              }
            });

            //Other Category,Other Brand,Other Model Information Cols
            if (colData.category && colData.category.otherName)
              obj[mapedFields.other_category] = colData.category.otherName;
            if (colData.brand && colData.brand.otherName)
              obj[mapedFields.other_brand] = colData.brand.otherName;
            if (colData.model && colData.model.otherName)
              obj[mapedFields.other_model] = colData.model.otherName;
            if (colData.group && colData.group.name)
              obj[mapedFields.group_name] = colData.group.name;

            //Seller Information Cols
            if (colData.seller) {
              obj[mapedFields.seller_name] = _.get(colData, 'seller.fname', '') + _.get(colData, 'seller.lname', '');
              obj[mapedFields.seller_email] = _.get(colData, 'seller.email', '');
              obj[mapedFields.seller_mobile] = _.get(colData, 'seller.mobile', '');
              obj[mapedFields.seller_role] = _.get(colData, 'seller.role', '');
              obj[mapedFields.seller_customerId] = _.get(colData, 'seller.customerId', '');
            }

            //Technical Information Cols
            if (colData.technicalInfo) {
              ['grossWeight', 'operatingWeight', 'bucketCapacity', 'enginePower', 'liftingCapacity'].forEach(function (x) {
                if (colData.technicalInfo[x]) {
                  obj[mapedFields[x]] = colData.technicalInfo[x];
                }
              })
            }

            //Service Information Cols
            if (colData.serviceInfo && colData.serviceInfo.length) {
              ['authServiceStation', 'serviceAt'].forEach(function (x) {
                if (colData.serviceInfo && colData.serviceInfo.length && colData.serviceInfo[0] && colData.serviceInfo[0][x]) {
                  obj[mapedFields[x]] = colData.serviceInfo[0][x];
                }
              })

              if (colData.serviceInfo && colData.serviceInfo.length && colData.serviceInfo[0] && colData.serviceInfo[0].servicedate)
                obj[mapedFields.servicedate] = Utillity.toIST(colData.serviceInfo[0].servicedate)


              if (colData.serviceInfo && colData.serviceInfo.length && colData.serviceInfo[0] && colData.serviceInfo[0].operatingHour) {
                obj[mapedFields.serviceOperatingHour] = colData.serviceInfo[0].operatingHour;
              }
            }

            //Rent Information Cols
            if (colData.rent) {
              if (colData.rent.rateHours) {
                obj[mapedFields.rateHours] = 'Yes';
                ['minPeriodH', 'maxPeriodH', 'rentAmountH', 'seqDepositH'].forEach(function (x) {
                  if (colData.rent.rateHours[x]) {
                    obj[mapedFields[x]] = colData.rent.rateHours[x];
                  }
                })
              }

              if (colData.rent.rateDays) {
                obj[mapedFields.rateDays] = 'Yes';
                ['minPeriodD', 'maxPeriodD', 'rentAmountD', 'seqDepositD'].forEach(function (x) {
                  if (colData.rent.rateDays[x]) {
                    obj[mapedFields[x]] = colData.rent.rateDays[x];
                  }
                })
              }

              if (colData.rent.rateMonths) {
                obj[mapedFields.rentMonths] = 'Yes';
                ['minPeriodM', 'maxPeriodM', 'rentAmountM', 'seqDepositM'].forEach(function (x) {
                  if (colData.rent && colData.rent.rateHours && colData.rent.rateHours[x]) {
                    obj[mapedFields[x]] = colData.rent.rateMonths[x];
                  }
                })
              }

              if (colData.operatingHour) {
                obj[mapedFields.motorOperatingHour] = colData.operatingHour;
              }

              if (colData.rent.negotiable)
                obj[mapedFields.negotiable] = 'Yes';
              else
                obj[mapedFields.negotiable] = 'No';




              ['fromDate', 'toDate'].forEach(function (x) {
                if (colData.rent[x]) {
                  obj[mapedFields[x]] = Utillity.toIST(colData.rent[x]);
                }
              })
            }

            if (colData.user) {
              obj.Uploaded_By = colData.user.fname + ' ' + colData.user.lname;
            }

            if (colData.createdAt) {
              obj.Listing_Date = Utillity.toIST(colData.createdAt) || '';
            }

            if(colData.repoDate){
              obj.Parked_Since = moment(colData.repoDate).utcOffset('+0530').format('MM/DD/YYYY') || '';
            }

            extraCols.forEach(function(x) {
              if (colData[x]) {
                obj[mapedFields[x]] = 'Yes';
              } else
                obj[mapedFields[x]] = 'No';
            });

            //Admin Cols only visible to admin
            var adminCols = ['assetStatus', 'dispSellerInfo', 'dispSellerContact', 'alternateMobile', 'dispSellerAlternateContact', 'featured', 'status'];

            if (req.body.role !== 'admin') {
              adminCols.forEach(function (x) {
                if (obj[mapedFields[x]])
                  delete obj[x]
              });
            }

            delete obj.__rowNum__;

            responseData.push(obj);
          }
        });

        var fields = Object.keys(productFieldsMap);
        var tempObj = {};
        var tempArr = [];

        responseData.forEach(function (x) {
          fields.forEach(function (key) {
            tempObj[key] = x[key] !== undefined ? x[key] : '';
          });
          tempArr.push(tempObj);
          tempObj = {};
        });
        try {
          Utility.convertToCSV(res, tempArr);
        } catch (excp) {
          throw excp;
        }

      });
  }
}
//Bulk product status update
exports.bulkProductStatusUpdate = function (req, res) {
  var fileName = req.body.filename;
  //var user = req.body.user;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    console.log(e);
    return handleError(res, "Error in file upload")
  }
  if (!workbook)
    return res.status(404).send("Error in file upload")
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  req.counter = 0;
  req.numberOfCount = data.length;
  req.errors = [];
  req.successProductArr = [];
  req.assetIdCache = {};
  bulkProductStatusUpdate(req, res, data);
}

function fetchCategory(category, cb) {
  Category.find({
    name: category
  }).exec(function (err, categoryData) {
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

  Brand.find(filter).exec(function (err, brandData) {
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

  Model.find(filter).exec(function (err, modelData) {
    if (err) {
      debug(err);
      return cb(err);
    }
    return cb(null, modelData);
  });
}

exports.updateExcelData = function (req, res, next) {
  //console.log("I am here",req.updateData);
  var successCount = 0;
  if (!req.updateData.length && !req.errorList.length) {
    req.errorList = [];
    for (var j = 0; j < req.totalCount; j++) {
      req.errorList.push({
        Error: 'Nothing to update',
        rowCount: j + 1
      });
    }
  }

  if (!req.updateData.length && req.errorList.length)
    return res.json({ successCount: successCount, errorList: req.errorList, totalCount: req.totalCount });

  var dataToUpdate = req.updateData;

  //console.log("data to be updated",dataToUpdate);
  async.eachLimit(dataToUpdate, 5, intialize, finalize);

  function finalize(err) {
    if (err) {
      console.log(err);
      return next(new APIError(500, 'Error while updation'));
    }

    return res.json({ successCount: successCount, errorList: req.errorList, totalCount: req.totalCount });
  }

  function intialize(data, cb) {
    var assetId = data.assetId;
    delete data.assetId;
    Product.findOneAndUpdate({ assetId: assetId }, { '$set': data }, function (err, doc) {
      if (err || !doc) {
        req.errorList.push({
          Error: err + 'Error while updating information ',
          rowCount: data.rowCount
        });
        return cb();
      }
      successCount++;
      return cb();
    });
  }

};

exports.createProductReq = function (req, res, next) {
  //console.log("create",req.updateData);
  if (!req.updateData.length && !req.errorList.length)
    return next(new APIError(500, 'Error while updation'));

  var successCount = 0;
  if (!req.updateData.length && req.errorList.length)
    return res.json({ successCount: successCount, errorList: req.errorList, totalCount: req.totalCount });

  var dataToUpdate = req.updateData;

  async.eachLimit(dataToUpdate, 5, intialize, finalize);

  function finalize(err) {
    if (err) {
      console.log(err);
      return next(new APIError(500, 'Error while updation'));
    }

    return res.json({ successCount: successCount, errorList: req.errorList, totalCount: req.totalCount });
  }

  function intialize(data, cb) {
    data.images = [{}];
    data.user = req.body.user;
    data.assetStatuses = [{
      userId: data.user._id,
      status: 'listed',
      createdAt: new Date()
    }];

    IncomingProduct.create(data, function (err, doc) {
      if (err || !doc) {
        req.errorList.push({
          Error: 'Error while updating information',
          rowCount: data.rowCount
        })
        return cb();
      }
      successCount++;
      return cb();
    })
  }
}

exports.parseExcel = function (req, res, next) {

  var body = req.body;
  var ret;
  ['fileName', 'user', 'type'].some(function (x) {
    if (!body[x]) {
      ret = x;
    }
  });

  if (ret)
    return next(new APIError(412, 'Missing mandatory parameter: ' + ret));

  var options = {
    file: body.fileName,
    headers: Object.keys(productFieldsMap),
    mapping: productFieldsMap,
    notValidateHeaders: true
  };
  req.excelData = Utillity.toJSON(options);
  req.reqType = 'Update';
  return next();
};

exports.parseUpdateData = function (req, res, next) {
  var data = req.body.data;
  //  var ret;
  //  ['fileName', 'user','type'].some(function(x) {
  //    if (!body[x]) {
  //      ret = x;
  //    }
  //  });

  //  if(ret)
  //    return next(new APIError(412,'Missing mandatory parameter: ' + ret));

  if (!data.length) {
    return res.status(400).send('Missing mandatory parameter');
  }
  data = JSON.parse(JSON.stringify(data));
  data = data.filter(function (x) {
    Object.keys(x).forEach(function (key) {
      if (productFieldsMap[key]) {
        if (key !== "Row_Count") {
          x[productFieldsMap[key]] = trim(x[key] || "");
        }
        else {
          // x.key=Number(x.key);
          x[productFieldsMap[key]] = x[key] || 0;
        }
      }
      delete x[key];
    });
    return x;
  });
  req.excelData = data;
  req.reqType = 'Update';
  return next();
};



exports.parseImportExcel = function (req, res, next) {
  var body = req.body;
  var ret;
  ['filename', 'user'].forEach(function (x) {
    if (!body[x]) {
      ret = x;
    }
  });

  if (ret)
    return next(new APIError(412, 'Missing mandatory parameter: ' + ret));

  var options = {
    file: body.filename,
    headers: Object.keys(productFieldsMap),
    mapping: productFieldsMap,
    notValidateHeaders: true
  };

  req.excelData = Utillity.toJSON(options);
  req.reqType = 'Upload';
  return next();
}

exports.parseImportData = function (req, res, next) {
  var data = req.body.data;
  //var fieldMapping = Object.keys(productFieldsMap);
  if (!productFieldsMap || !data.length) {
    return res.status(400).send('Invalid or Missing mapping');//new Error('Invalid or Missing mapping');
  }

  //    if (!fieldMapping.__rowNum__)
  //      fieldMapping.__rowNum__ = 'rowCount';

  data = data.filter(function (x) {
    Object.keys(x).forEach(function (key) {
      if (productFieldsMap[key]) {
        if (key !== "Row_Count") {
          x[productFieldsMap[key]] = trim(x[key] || "");
        }
        else {
          // x.key=Number(x.key);
          x[productFieldsMap[key]] = x[key] || 0;
        }
      }
      delete x[key];
    });
    return x;
  });

  req.excelData = data;

  req.reqType = 'Upload';
  return next();

};


exports.validateExcelData = function (req, res, next) {
  var excelData = req.excelData;
  var user = req.body.user;
  var reqType = req.reqType;
  var type = req.body.type;
  if (!reqType)
    return next(new APIError(400, 'Invalid request type'));

  if (excelData instanceof Error) {
    return next(new APIError(412, 'Invalid Excel File'));
  }

  if (!excelData || !excelData.length) {
    return next(new APIError(404, 'No Data to update'));
  }

  var updateData = [];
  var errorList = [];
  var assetIdObj = {};
  req.totalCount = excelData.length;
  async.eachLimit(excelData, 10, intialize, finalize);
  function finalize(err) {
    if (err) {
      console.log(err);
      return next(new APIError(500, 'Error while updating'));
    }
    if (!updateData.length && !errorList.length) {
      return res.json({ successCount: 0, errorList: req.errorList, totalCount: req.totalCount });
    }
    req.errorList = errorList;
    req.updateData = updateData;
    next();
  }

  function intialize(row, cb) {
    if (!row.assetId) {
      errorList.push({
        Error: 'Asset Id missing',
        rowCount: row.rowCount
      });
      return cb();
    }

    /*AA:Process of bulk update/insert
    validateCategory : validate the category if and only if category related columns present in uploaded sheets
    validateSeller : validate seller if and only if seller mobile and email exists
    validateSeller : will take the info from sheet if not exists then check whether the combination of category,brand,model
    exits in db if found then update
    validateRentInfo : only update of tradeType is RENT or BOTH
    validateAdditionalInfo : Any othe column would be added here which does not require any processing
    validateOnlyAdminCols : This function validates the cols which only admin can update
    */
    if (reqType === 'Update') {
      Product.find({
        assetId: row.assetId
      }, function (err, doc) {
        if (err || !doc.length) {

          errorList.push({
            Error: 'No asset id found',
            rowCount: row.rowCount
          });
          return cb();
        }

        if (type === 'template_update') {
          async.parallel({
            validateGenericField: validateGenericField,
            validateCategory: validateCategory, //{}
            validateSeller: validateSeller,
            validateTechnicalInfo: validateTechnicalInfo,
            validateServiceInfo: validateServiceInfo,
            //validateCity : validateCity,
            //validateRentInfo: validateRentInfo,
            validateTradetype: validateTradetype,
            validateAdditionalInfo: validateAdditionalInfo,
            validateOnlyAdminCols: validateOnlyAdminCols,
            validateForBid: validateForBid,
            validatePrice: validatePrice
          }, buildData);
        } else if (type === 'auction_update') {
          async.parallel({
            validateAuction: validateAuction
          }, buildData);
        } else
          return cb();
      });
    } else if (reqType === 'Upload') {
      //console.log("uploading");
      if (!assetIdObj[row.assetId]) {
        assetIdObj[row.assetId] = true;
        //debugger;
        async.parallel({
          validateGenericField: validateGenericField,
          validateMadnatoryCols: validateMadnatoryCols,
          validateDupProd: validateDupProd,
          validateDupIncomingProd: validateDupIncomingProd,
          validateCategory: validateCategory, //{}
          validateSeller: validateSeller,
          validateTechnicalInfo: validateTechnicalInfo,
          validateServiceInfo: validateServiceInfo,
          validateCity: validateCity,
          validateRentInfo: validateRentInfo,
          validateAdditionalInfo: validateAdditionalInfo,
          validateOnlyAdminCols: validateOnlyAdminCols,
          validatePrice: validatePrice
        }, buildData);
      } else {
        errorList.push({
          Error: 'Duplicate Records in excel sheet',
          rowCount: row.rowCount
        });
        return cb();
      }
    }

    function validateForBid(callback) {
      if (row.tradeType !== 'RENT' || !row.assetId)
        return callback();

      Product.find({ assetId: row.assetId, deleted: false }, function (err, prds) {
        if (err || !prds.length) {
          errorList.push({
            Error: 'Error in finding product',
            rowCount: row.rowCount
          });
          return callback('Error')
        };
        var filter = {};
        filter['product.proData'] = prds[0]._id;
        filter.offerStatus = offerStatuses[0];
        AssetSaleModel.find(filter, function (err, resultArr) {
          if (err) {
            errorList.push({
              Error: 'Error in finding active bids',
              rowCount: row.rowCount
            });
            return callback('Error')
          };
          if (resultArr.length) {
            errorList.push({
              Error: 'There is active bid for this product',
              rowCount: row.rowCount
            });
            return callback("Error");
          }
          return callback();
        });
      });
    }

    function validateGenericField(callback) {
      var obj = {};
      var numericColumns = ['valuationAmount', 'parkingChargePerDay', 'reservePrice', 'grossPrice'];
      var dateColumns = ['repoDate'];
      var fieldsToBeCopied = ['addressOfAsset', 'parkingPaymentTo'];
      numericColumns.forEach(function (x) {
        if (row[x] && !isNaN(row[x]))
          obj[x] = Number(row[x]);
      });
      dateColumns.forEach(function (x) {
        if (row[x]) {
          var d = Utillity.dateUtil.isValidDateTime(row[x], 'MM/DD/YYYY');
          if (d.isValid())
            obj[x] = new Date(Utillity.dateUtil.validateAndFormatDate(d, 'MM/DD/YYYY'));
        }
      });

      fieldsToBeCopied.forEach(function(x){
        if(row[x])
          obj[x] = row[x];
      });
      //console.log("object generic",obj);
      return callback(null, obj);
    }

    function validatePrice(callback) {
      if (row.tradeType && row.tradeType.toLowerCase() === 'rent')
        return callback();
      var isCustomer = ['enterprise', 'admin'].indexOf(req.body.user.role) === -1 ? true : false;
      var obj = {};
      row.priceOnRequest = row.priceOnRequest || "";
      obj.currencyType = row.currencyType || "INR";
      if (row.grossPrice) {
        obj.grossPrice = row.grossPrice;
      }
      obj.priceOnRequest = row.priceOnRequest.toLowerCase() === 'yes' ? true : false;
      if (type === 'template_update' && !row.priceOnRequest)
        delete obj.priceOnRequest;
      if (isCustomer) {
        if (!obj.grossPrice)
          obj.priceOnRequest = true;
        return callback(null, obj);
      }

      if (!obj.grossPrice && !row.reservePrice && !row.valuationAmount) {
        if (type === 'template_update') {
          Product.find({
            assetId: row.assetId
          }, function (err, prod) {
            if (prod[0].grossPrice) {
              if (row.priceOnRequest)
                obj.priceOnRequest = row.priceOnRequest.toLowerCase() === 'yes' ? true : false;
            }
            return callback(null, obj);
          });
          return;
        }
        else {
          obj.priceOnRequest = true;
          return callback(null, obj);
        }
      }

      if (row.reservePrice) {
        obj.grossPrice = row.reservePrice;
        return callback(null, obj);
      } else if (row.valuationAmount) {
        AssetSaleUtil.getMarkupOnSellerMobile(row.seller_mobile, function (err, result) {
          if (err) {
            errorList.push({
              Error: 'Error in getting markup data.',
              rowCount: row.rowCount
            });
            return callback('Error');
          }
          var markupPercent = 0;
          if (result && result.length)
            markupPercent = result[0].price || 0;

          var buyNowPrice = Number(row.valuationAmount || 0) + (Number(row.valuationAmount || 0) * Number(markupPercent || 0) / 100);
          obj.grossPrice = Math.round(buyNowPrice || 0);
          return callback(null, obj);
        });
      } else if (obj.grossPrice)
        return callback(null, obj);
      else {
        errorList.push({
          Error: 'Unable to process your request.Please contact support team.',
          rowCount: row.rowCount
        });
        return callback('Error');
      }
    }

    function validateCity(callback) {
      if (row.city) {
        CityModel.City.find({ name: row.city }, function (err, cityInfo) {
          if (err || !cityInfo) {
            errorList.push({
              Error: 'Error while validating city',
              rowCount: row.rowCount
            });
            return callback('Error');
          }

          if (!cityInfo.length) {
            errorList.push({
              Error: 'Invalid City',
              rowCount: row.rowCount
            });
            return callback('Error');
          }

          if (cityInfo[0].state.name !== row.state || cityInfo[0].state.country !== row.country) {
            errorList.push({
              Error: 'Invalid State or country',
              rowCount: row.rowCount
            });
            return callback('Error');
          }

          return callback();
        });
      } else {
        return callback();
      }
    }

    function validateMadnatoryCols(callback) {
      var error;
      ['assetId', 'category', 'brand', 'model', 'tradeType', 'mfgYear', 'currencyType', 'country', 'state', 'city', 'seller_mobile'].some(function (x) {
        if (!row[x]) {
          error = true;
          errorList.push({
            Error: 'Missing mandatory parameter : ' + x,
            rowCount: row.rowCount
          });
        }
      });

      if (error)
        return callback('Error');

      if (row.category.toLowerCase() === 'other' && !row.other_category) {
        errorList.push({
          Error: 'Other category is mandatory field when category is other',
          rowCount: row.rowCount
        });

        return callback('Error');
      }

      if (row.brand.toLowerCase() === 'other' && !row.other_brand) {
        errorList.push({
          Error: 'Other category is mandatory field when category is other',
          rowCount: row.rowCount
        });

        return callback('Error');
      }

      if (row.model.toLowerCase() === 'other' && !row.other_model) {
        errorList.push({
          Error: 'Other category is mandatory field when category is other',
          rowCount: row.rowCount
        });

        return callback('Error');
      }

      /* var  isCustomer = ['enterprise','admin'].indexOf(req.user.role) === -1? true:false;
       if(!isCustomer)
         return callback();
       row.priceOnRequest = row.priceOnRequest || "";
 
       if(row.priceOnRequest.toLowerCase() !== 'yes' && !row.grossPrice ){
         errorList.push({
           Error : 'Selling price is mandatory when Price on request not selected',
           rowCount :row.rowCount
         });
 
         return callback('Error');
       }*/

      //console.log("object generic2 madnatory");
      return callback();

    }

    function validateAuction(callback) {
      if (user.role !== 'admin') {
        errorList.push({
          Error: 'User not authorized',
          rowCount: row.rowCount
        });
        return callback('Error');
      }

      if (row.auctionListing && row.auctionListing.toLowerCase() === 'yes') {
        if (!row.auctionId) {
          errorList.push({
            Error: 'Auction ID Missing',
            rowCount: row.rowCount
          });
          return callback('Error');
        }

        if (row.valuationReq.toLowerCase() !== 'yes' || !row.agencyName) {
          errorList.push({
            Error: 'Valuation Request is required while updating auction data',
            rowCount: row.rowCount
          });
          return callback('Error');
        }

        var reqOpts = {
          auctionId: row.auctionId,
          startDate: {
            $gt: new Date()
          }
        }

        var auctionMaster, vendorData,
          paymentMaster, paymentTransData,
          valuationData, auctionReqData, existingProduct;


        async.series({
          validateAuctionMaster: validateAuctionMaster,
          validateVendor: validateVendor,
          validatePaymentTrans: validatePaymentTrans,
          fetchPaymentMaster: fetchPaymentMaster,
          fetchProduct: fetchProduct,
          createPaymetTrans: createPaymetTrans,
          createValauationReq: createValauationReq,
          createAuctionRequest: createAuctionRequest
        }, middleManProcessing);

      } else if (row.auctionListing && row.auctionListing.toLowerCase() === 'no') {
        var obj = {
          auction: {},
          auctionListing: false
        }
        return callback();
      } else {
        errorList.push({
          Error: 'Nothing to update',
          rowCount: row.rowCount
        })
        return callback('Error');
      }

      function fetchProduct(innerCb) {
        Product.find({
          assetId: row.assetId
        }, function (err, doc) {
          if (err || !doc.length) {
            errorList.push({
              Error: 'No asset id found',
              rowCount: row.rowCount
            })
            return innerCb('Error');
          }
          existingProduct = doc[0];
          return innerCb();
        });
      }


      function middleManProcessing(err) {
        if (err) {
          return callback(err);
        }

        var obj = {
          auction: {
            id: auctionReqData._id,
            valuationId: valuationData._id
          },
          auctionListing: true
        };

        return callback(null, obj)
      }

      function createAuctionRequest(innerCb) {
        var auctionData = {
          valuationReport: '',
          dbAuctionId: auctionMaster[0]._id,
          emdAmount: row.emdAmount,
          user: user,
          seller: {
            "mobile": existingProduct.seller.mobile,
            "email": existingProduct.seller.email,
            "name": (existingProduct.seller.fname || '') + (existingProduct.seller.lname || ''),
            "_id": existingProduct.seller._id
          },
          status: 'payment_pending',
          statuses: [{
            createdAt: new Date(),
            status: 'payment_pending',
            userId: user._id
          }],
          product: {
            _id: existingProduct._id,
            assetId: existingProduct.assetId,
            city: existingProduct.city,
            name: existingProduct.name,
            status: existingProduct.status,
            category: existingProduct.category.name,
            brand: existingProduct.brand.name,
            model: existingProduct.model.name,
            mfgYear: existingProduct.mfgYear,
            productId: existingProduct.productId,
            serialNo: existingProduct.serialNo,
            grossPrice: existingProduct.grossPrice,
            assetDir: existingProduct.assetDir,
            primaryImg: existingProduct.primaryImg,
            isSold: existingProduct.isSold
          },
          startDate: auctionMaster[0].startDate,
          endDate: auctionMaster[0].endDate,
          auctionId: row.auctionId,
          transactionId: paymentTransData._id,
          valuation: {
            _id: valuationData._id,
            status: 'payment_pending'
          }
        };


        AuctionReq.create(auctionData, function (err, auctionInfo) {
          if (err || !auctionInfo) {
            errorList.push({
              Error: 'Error while creating Auction request',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          auctionReqData = auctionInfo;
          return innerCb();
        });
      }

      function createValauationReq(innerCb) {
        var valauationData = {
          valuationAgency: {
            _id: vendorData[0]._id,
            name: vendorData[0].entityName,
            email: vendorData[0].user.email,
            mobile: vendorData[0].user.mobile,
            countryCode: '91'
          },
          valuate: true,
          user: user,
          seller: existingProduct.seller,
          initiatedBy: 'Admin',
          purpose: 'Listing in auction',
          product: {
            _id: existingProduct._id,
            assetId: existingProduct.assetId,
            city: existingProduct.city,
            name: existingProduct.name,
            status: existingProduct.status,
            category: existingProduct.category.name,
            mfgYear: existingProduct.mfgYear
          },
          status: 'payment_pending',
          statuses:
            [{
              createdAt: new Date(),
              status: 'payment_pending',
              userId: user._id
            }],
          isAuction: true
        };

        ValuationReq.create(valauationData, function (err, valuationInfo) {
          if (err || !valuationInfo) {
            errorList.push({
              Error: 'Error while creating valuation request',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          valuationData = valuationInfo;
          return innerCb();
        });
      }

      function createPaymetTrans(innerCb) {
        var auctionFee, valuationFee;
        var ret;
        ['auctionMaster', 'vendorData', 'paymentmaster'].some(function (x) {
          if (!x) {
            errorList.push({
              Error: 'Error while fetching payment master/auction master/vendor data',
              rowCount: row.rowCount
            });

            ret = true;
            return true;
          }
        })

        if (ret) {
          return innerCb('Error');
        }

        paymentMaster.forEach(function (x) {
          if (x.serviceCode === 'Auction')
            auctionFee = x.fees
          else if (x.serviceCode === "Valuation")
            valuationFee = x.fees;
        });

        if (!+auctionFee || !+valuationFee) {
          errorList.push({
            Error: 'Auction Fee/Valuation Fee master not present',
            rowCount: row.rowCount
          });
          return innerCb('Error');
        }

        var paymentData = {
          paymets: [{ type: 'auctionreq', charge: auctionFee },
          { type: 'valuationreq', charge: valuationFee }],
          totalAmount: Number(auctionFee) + Number(valuationFee),
          requestType: 'Auction Listing',
          product: {
            type: 'equipment',
            _id: existingProduct._id,
            assetId: existingProduct.assetId,
            city: existingProduct.city,
            name: existingProduct.name,
            status: existingProduct.status,
            category: existingProduct.category.name
          },
          user: user,
          status: existingProduct.status,
          statuses: existingProduct.statuses,
          paymentMode: 'offline',
          auctionId: row.auctionId,
          entityName: row.agencyName
        };

        PaymentTransaction.create(paymentData, function (err, paymentInfo) {
          if (err || !paymentInfo) {
            errorList.push({
              Error: 'Error while creating payment request',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }
          paymentTransData = paymentInfo;
          return innerCb();
        });

      }

      function fetchPaymentMaster(innerCb) {
        PaymentMaster.find({ serviceCode: { $in: ['Auction', 'Valuation'] } }, function (err, masterData) {
          if (err || !masterData) {
            errorList.push({
              Error: 'Error while fetching payment master data',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          if (!masterData.length) {
            errorList.push({
              Error: 'Payment details not found',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }
          paymentMaster = masterData;
          return innerCb();
        })
      }

      function validateAuctionMaster(innerCb) {
        AuctionMaster.find(reqOpts, function (err, auction) {
          if (err || !auction) {
            errorList.push({
              Error: 'Error while validating auction id',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          if (!auction.length) {
            errorList.push({
              Error: 'Invalid Auction id',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }
          auctionMaster = auction;
          return innerCb();
        })
      }

      function validateVendor(innerCb) {
        reqOpts = {
          entityName: row.agencyName,
        };

        VendorModel.find(reqOpts, function (err, agency) {
          if (err || !agency) {
            errorList.push({
              Error: 'Error while validating agency',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          if (!agency.length) {
            errorList.push({
              Error: 'Invalid agency or Agency not authorized',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          vendorData = agency;
          return innerCb();
        });
      }

      function validatePaymentTrans(innerCb) {
        reqOpts = {
          auctionId: row.auctionId,
          entityName: row.agencyName,
          'product.assetId': row.assetId
        };

        PaymentTransaction.find(reqOpts, function (err, payment) {
          if (err || !payment) {
            errorList.push({
              Error: 'Error while validating payment transaction',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          if (payment.length) {
            errorList.push({
              Error: 'Payment already been made for this asset for this auctionId and agency',
              rowCount: row.rowCount
            });
            return innerCb('Error');
          }

          return innerCb();
        });
      }
    }



    function validateDupProd(callback) {
      Product.find({ assetId: row.assetId }, function (err, products) {
        if (err || !products) {
          errorList.push({
            Error: 'Error while validating product',
            rowCount: row.rowCount
          });
          return callback('Error');
        }

        if (products.length) {
          errorList.push({
            Error: 'Duplicate Asset Id',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        //console.log("I m here not");
        return callback(null);
      });
    }

    function validateDupIncomingProd(callback) {
      IncomingProduct.find({ assetId: row.assetId }, function (err, products) {
        if (err || !products) {
          errorList.push({
            Error: 'Error while validating product',
            rowCount: row.rowCount
          });
          return callback('Error');
        }

        if (products.length) {
          errorList.push({
            Error: 'Duplicate Asset Id present in queue',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        //console.log(" I am validating dup product");
        return callback();
      });
    }

    function buildData(err, parseData) {
      if (err)
        return cb();

      var obj = {};
      for (var v in parseData) {
        if (parseData[v] && Object.keys(parseData[v]).length) {
          _.extend(obj, parseData[v]);
        }
      }

      if (Object.keys(obj).length) {
        obj.assetId = row.assetId;
        obj.rowCount = row.rowCount;
        updateData.push(obj);
      }

      //console.log("boject",updateData);
      return cb();
    }


    function validateOnlyAdminCols(callback) {
      var obj = {};
      var adminCols = ['assetStatus', 'dispSellerInfo', 'dispSellerContact', 'alternateMobile', 'dispSellerAlternateContact', 'featured', 'status'];

      if (user.role !== 'admin') {
        adminCols.forEach(function (x) {
          if (row[x])
            delete row[x];
        });
        return callback();
      }

      var assetStatus = row.assetStatus;
      if (type === 'template_update') {
        if (assetStatus) {
          assetStatus = trim(assetStatus).toLowerCase();
          if (['listed', 'sold', 'rented', 'not_available'].indexOf(assetStatus) == -1) {
            errorList.push({
              Error: 'Not valid status',
              rowCount: row.rowCount
            });
            return callback('Error');
          }
          /*
          var ret = checkValidTransition(row.tradeType, assetStatus);

          if (!ret) {
              errorList.push({
                  Error: 'Invalid status transition',
                  rowCount: row.rowCount
              });
              return callback('Error');
          } else {
              */
          obj.updatedAt = new Date();
          obj.assetStatus = assetStatus;
          if (assetStatus != 'listed') {
            //obj.featured = false;
            obj.isSold = true;
          }
          //}
        }
      }
      else {
        if (assetStatus && row.tradeType) {
          assetStatus = trim(assetStatus).toLowerCase();
          if (['listed', 'sold', 'rented', 'not_available'].indexOf(assetStatus) == -1) {
            errorList.push({
              Error: 'Not valid status',
              rowCount: row.rowCount
            });
            return callback('Error');
          }
          var ret = checkValidTransition(row.tradeType, assetStatus);

          if (!ret) {
            errorList.push({
              Error: 'Invalid status transition',
              rowCount: row.rowCount
            });
            return callback('Error');
          } else {
            obj.updatedAt = new Date();
            obj.assetStatus = assetStatus;
            if (assetStatus != 'listed') {
              //obj.featured = false;
              obj.isSold = true;
            }
          }
        }
      }

      if (row.featured) {
        var featured = trim(row.featured || "").toLowerCase();
        obj["featured"] = featured == 'yes' || featured == 'y' ? true : false;
      }

      if (row.status) {
        if (row.status.toLowerCase() === 'yes')
          obj.status = true;
        else if (row.status.toLowerCase() === 'no')
          obj.status = false;
        else {
          errorList.push({
            Error: 'Invalid status',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
      }


      ['dispSellerContact', 'dispSellerAlternateContact'].forEach(function (x) {
        if (row[x]) {
          if (row[x].toLowerCase() === 'yes')
            obj[x] = true
          else if (row[x].toLowerCase() === 'no')
            obj[x] = false;
          else
            delete row[x];
        }
      });



      if (row.dispSellerInfo && row.dispSellerInfo.toLowerCase() === 'yes') {
        obj.dispSellerInfo = 'yes';
      } else {
        obj.dispSellerInfo = 'no';
      }


      if (row.alternateMobile)
        obj.alternateMobile = row.alternateMobile;

      return callback(null, obj);


    }

    function validateAdditionalInfo(callback) {
      var obj = {};

      if (row.isEngineRepaired) {
        var engRepOver = trim(row.isEngineRepaired || "").toLowerCase();
        obj.isEngineRepaired = engRepOver == 'yes' || engRepOver == 'y' ? true : false;
      }

      if (row.productCondition)
        obj["productCondition"] = trim(row.productCondition || "").toLowerCase();

      ['country', 'state', 'city'].forEach(function (x) {
        if (row[x])
          obj[x] = trim(row[x]);
      })

      var additionalCols = ['comment', 'rateMyEquipment', 'mileage', 'serialNo', 'mfgYear', 'variant', 'engineNo', 'chasisNo', 'registrationNo', 'specialOffers'];
      additionalCols.forEach(function (x) {
        if (row[x]) {
          obj[x] = row[x];
        }
      });

      if (row.videoLinks) {
        obj.videoLinks = [{
          uri: row.videoLinks
        }];
      }

      if (row.motorOperatingHour) {
        obj.operatingHour = row.motorOperatingHour;
      }

      var validTradeType = ['sell', 'rent', 'both', 'not_available'];
      if (row.tradeType && (validTradeType.indexOf(row.tradeType.toLowerCase()) > -1)) {
        obj.tradeType = row.tradeType.toUpperCase();
      }

      return callback(null, obj);
    }

    function validateRentInfo(callback) {
      if (row.tradeType && (row.tradeType.toLowerCase() === 'sell' || row.tradeType.toLowerCase() === "not_available"))
        return callback();
      var product = {};
      // if (row.tradeType && row.tradeType.toLowerCase() !== "sell" && row.tradeType.toLowerCase() !== "not_available" ) {
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
          Error: 'Mandatory field Availability_of_Asset_From is invalid or not present',
          rowCount: row.rowCount
        });
        return callback('Error');
      }

      product["rent"].fromDate = fromDate;
      var toDate = new Date(row["toDate"]);
      validDate = isValid(fromDate);
      if (!toDate || !validDate) {
        errorList.push({
          Error: 'Mandatory field Availability_of_Asset_To is invalid or not present',
          rowCount: row.rowCount
        });
        return callback('Error');
      }
      product["rent"].toDate = toDate;

      //rent hours
      var negotiableFlag = true;
      if (rateTypeH == "yes" || rateTypeH == 'y') {
        negotiableFlag = false;
        var minPeriodH = row["minPeriodH"];
        if (!+minPeriodH) {
          errorList.push({
            Error: 'Mandatory field Min_Rental_Period_Hours is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateHours.minPeriodH = Number(trim(minPeriodH));

        var maxPeriodH = row["maxPeriodH"];
        if (isNaN(maxPeriodH)) {
          errorList.push({
            Error: 'Mandatory field Max_Rental_Period_Hours is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateHours.maxPeriodH = Number(trim(maxPeriodH));

        var rentAmountH = row["rentAmountH"];
        if (isNaN(rentAmountH)) {
          errorList.push({
            Error: 'Mandatory field Rent_Amount_Hours is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateHours.rentAmountH = Number(trim(rentAmountH));

        var seqDepositH = row["seqDepositH"];
        if (isNaN(seqDepositH)) {
          errorList.push({
            Error: 'Mandatory field Security_Deposit_Hours is invalid or not present',
            rowCount: row.rowCount
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
            Error: 'Mandatory field Min_Rental_Period_Days is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateDays.minPeriodD = Number(trim(minPeriodD));

        var maxPeriodD = row["maxPeriodD"];
        if (isNaN(maxPeriodD)) {
          errorList.push({
            Error: 'Mandatory field Max_Rental_Period_Days is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateDays.maxPeriodD = Number(trim(maxPeriodD));

        var rentAmountD = row["rentAmountD"];
        if (isNaN(rentAmountD)) {
          errorList.push({
            Error: 'Mandatory field Rent_Amount_Days is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateDays.rentAmountD = Number(trim(rentAmountD));

        var seqDepositD = row["seqDepositD"];
        if (isNaN(seqDepositD)) {
          errorList.push({
            Error: 'Mandatory field Security_Deposit_Days is invalid or not present',
            rowCount: row.rowCount
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
            Error: 'Mandatory field Min_Rental_Period_Months is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateMonths.minPeriodM = Number(trim(minPeriodM));

        var maxPeriodM = row["maxPeriodM"];
        if (isNaN(maxPeriodM)) {
          errorList.push({
            Error: 'Mandatory field Max_Rental_Period_Months is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateMonths.maxPeriodM = Number(trim(maxPeriodM));

        var rentAmountM = row["rentAmountM"];
        if (isNaN(rentAmountM)) {
          errorList.push({
            Error: 'Mandatory field Rent_Amount_Months is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateMonths.rentAmountM = Number(trim(rentAmountM));

        var seqDepositM = row["seqDepositM"];
        if (isNaN(seqDepositM)) {
          errorList.push({
            Error: 'Mandatory field Security_Deposit_Months is invalid or not present',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        product["rent"].rateMonths.seqDepositM = Number(trim(seqDepositM));
      }
      product["rent"].negotiable = negotiableFlag;
      return callback(null, product);
    }

    //validate service related information
    function validateServiceInfo(callback) {
      var obj = {};
      ['authServiceStation', 'serviceAt', 'operatingHour'].forEach(function (x) {
        if (row[x]) {
          if (!obj.serviceInfo) {
            obj.serviceInfo = [{}]
          }
          obj.serviceInfo[0][x] = row[x];
        }
      })

      if (row.servicedate) {
        var servicedate = new Date(row["servicedate"]);
        var validDate = isValid(servicedate);
        if (!obj.serviceInfo) {
          obj.serviceInfo = [{}]
        }
        if (servicedate && validDate) {
          obj.serviceInfo[0].servicedate = servicedate;
        }

      }
      return callback(null, obj);
    }
    
    //validate Trade Type
    function validateTradetype ( callback ) {
        if ( row.tradeType && row.tradeType.toLowerCase()==='sell' ) {
            var filter = {};
            filter['product.assetId'] = row.assetId;
            filter['bidStatus'] = 'Accepted';
            
            AssetSaleModel.find(filter,function(err,bids){
                if(err || !bids.length){
                    return callback();
                };
                
                if(bids && bids.length){
                    errorList.push({
                        Error: "Asset Trade Type can't be modified as there is an active bid on it",
                        rowCount: row.rowCount
                    });
                    return callback('Error');
                }
                else
                    return callback();
            });
        }
        else return callback();
    }

    //validate Technical information
    function validateTechnicalInfo(callback) {
      var obj = {};
      var techCols = ['grossWeight', 'operatingWeight', 'bucketCapacity', 'enginePower', 'liftingCapacity'];
      techCols.forEach(function (x) {
        if (row[x] && !isNaN(row[x])) {
          if (!obj.technicalInfo) {
            obj.technicalInfo = {};
          }
          obj.technicalInfo[x] = Number(row[x]);
        }
      })

      if (!obj.technicalInfo && row.category && row.brand && row.model) {
        productInfoModel.find({
          type: 'technical',
          'information.category': row.category,
          'information.brand': row.brand,
          'information.model': row.model
        }).exec(function (err, data) {
          if (!err && data.length) {
            obj.technicalInfo = {};
            obj.technicalInfo.grossWeight = data[0]._doc.information.grossWeight;
            obj.technicalInfo.operatingWeight = data[0]._doc.information.operatingWeight;
            obj.technicalInfo.bucketCapacity = data[0]._doc.information.bucketCapacity;
            obj.technicalInfo.enginePower = data[0]._doc.information.enginePower;
            obj.technicalInfo.liftingCapacity = data[0]._doc.information.liftingCapacity;
          }
          return callback(null, obj);
        })
      } else {
        return callback(null, obj);
      }
    }


    //validate seller information if exists
    function validateSeller(callback) {
      var obj = {};
      if (row.seller_mobile) {
        var filter = {};
        filter.deleted = false;
        filter.status = true;
        filter.mobile = row.seller_mobile;
        if (row.seller_email)
          filter.email = row.seller_email;
        User.find(filter, function (err, seller) {
          if (err || !seller) {
            errorList.push({
              Error: 'Error while fetching seller',
              rowCount: row.rowCount
            })
            return callback('Error');
          }

          if (!seller.length) {
            errorList.push({
              Error: 'Seller not exist',
              rowCount: row.rowCount
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
          if (obj.seller.role == 'enterprise')
            obj.seller.enterpriseId = seller[0].enterpriseId;
          obj.seller["lname"] = seller[0]['lname'];
          obj.seller["fname"] = seller[0]['fname'];
          obj.seller["_id"] = seller[0]['_id'] + "";
          obj.seller["customerId"] = seller[0]['customerId'];
          return callback(null, obj);
        })
      } else
        return callback(null, obj);
    }


    //validate Category if exists
    function validateCategory(callback) {
      var obj = {};
      var e;
      if (row.category && row.brand && row.model) {
        if (row.category === 'Other' && row.brand === 'Other' && row.model === 'Other') {
          e = ['other_category', 'other_brand', 'other_model'].some(function (x) {
            if (!row[x]) {
              errorList.push({
                Error: 'Missing mandatory parameter: ' + x,
                rowCount: row.rowCount
              });
              return true;
            }
          })

          if (e)
            return callback('Error');
        }

        fetchCategory(row.category, function (err, category) {
          if (err || !category) {
            errorList.push({
              Error: 'Error while fetching category',
              rowCount: row.rowCount
            })
            return callback('Error');
          }

          if (!category.length) {
            errorList.push({
              Error: 'Category not exist',
              rowCount: row.rowCount
            })
            return callback('Error');
          }

          var brandFilter = {
            name: row.brand,
            category: row.category,
            group: category[0]._doc.group.name
          };

          fetchBrand(brandFilter, function (err, brand) {
            if (err || !brand) {
              errorList.push({
                Error: 'Error while fetching brand',
                rowCount: row.rowCount
              })
              return callback('Error');
            }

            if (!brand.length) {
              errorList.push({
                Error: 'Brand not exist',
                rowCount: row.rowCount
              })
              return callback('Error');
            }

            var modelFilter = {
              name: row.model,
              category: row.category,
              group: category[0]._doc.group.name,
              brand: row.brand
            }

            fetchModel(modelFilter, function (err, model) {
              if (err || !model) {
                errorList.push({
                  Error: 'Error while fetching model',
                  rowCount: row.rowCount
                })
                return callback('Error');
              }

              if (!model.length) {
                errorList.push({
                  Error: 'model not exist',
                  rowCount: row.rowCount
                })
                return callback('Error');
              }

              obj.category = {
                _id: category[0]._doc._id,
                name: category[0]._doc.name
              };

              obj.brand = {
                _id: brand[0]._doc._id,
                name: brand[0]._doc.name
              };

              obj.model = {
                _id: model[0]._doc._id,
                name: model[0]._doc.name
              };

              obj.group = {
                _id: category[0]._doc.group._id,
                name: category[0]._doc.group.name
              }

              obj.name = row.category + ' ' + row.brand + ' ' + row.model;

              if (row.category === 'Other' && row.brand === 'Other' && row.model === 'Other') {
                obj.category.otherName = row.other_category;
                obj.brand.otherName = row.other_brand;
                obj.model.otherName = row.other_model;
                obj.name = row.other_category + ' ' + row.other_brand + ' ' + row.other_model;
              }

              if (row.variant)
                obj.name += ' ' + row.variant;
              return callback(null, obj);
            })
          })
        })
      } else {
        //console.log("validated category");
        return callback(null, obj);
      }
    }
  }
}


function bulkProductStatusUpdate(req, res, data) {
  if (req.counter < req.numberOfCount) {
    var row = data[req.counter];
    var assetIdVal = Number(row["Asset_ID*"]);
    if (!assetIdVal) {
      var errorObj = {};
      errorObj['rowCount'] = req.counter + 2;
      errorObj['message'] = "Asset_ID is mandatory to be filled.";
      req.errors[req.errors.length] = errorObj;
      req.counter++;
      bulkProductStatusUpdate(req, res, data);
      return;
    }
    assetIdVal = assetIdVal + '';
    //console.log("AssetID:",assetIdVal);
    Product.findOne({ assetId: assetIdVal }, function (err, product) {
      if (err) {
        var errorObj = {};
        errorObj["rowCount"] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj["message"] = "Unknown Error.";
        req.errors[req.errors.length] = errorObj;
        req.counter++;
        bulkProductStatusUpdate(req, res, data);
        return;
      } else if (!product) {
        var errorObj = {};
        errorObj["rowCount"] = req.counter + 2;
        errorObj['AssetId'] = assetIdVal;
        errorObj["message"] = "Asset_ID does not exist in the syatem.";
        req.errors[req.errors.length] = errorObj;
        req.counter++;
        bulkProductStatusUpdate(req, res, data);
        return;
      } else {
        var assetStatus = row["Asset_Status*"];
        if (!assetStatus) {
          var errorObj = {};
          errorObj["rowCount"] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Status not found.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          bulkProductStatusUpdate(req, res, data);
          return;
        }
        assetStatus = trim(assetStatus).toLowerCase();
        if (['listed', 'sold', 'rented'].indexOf(assetStatus) == -1) {
          var errorObj = {};
          errorObj["rowCount"] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Not valid status.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          bulkProductStatusUpdate(req, res, data);
          return;
        }
        var ret = checkValidTransition(product.tradeType, assetStatus);

        if (!ret) {
          var errorObj = {};
          errorObj["rowCount"] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj["message"] = "Not valid status.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          bulkProductStatusUpdate(req, res, data);
          return;
        } else {
          var dataToSet = {};
          dataToSet.updatedAt = new Date();
          dataToSet.assetStatus = assetStatus;
          if (assetStatus != 'listed') {
            //dataToSet.featured = false;
            dataToSet.isSold = true;
          }
          //console.log(assetIdVal);
          Product.update({ assetId: assetIdVal }, { $set: dataToSet }, function (err) {
            if (err) {
              var errorObj = {};
              errorObj["rowCount"] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj["message"] = "Unknown Error.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              bulkProductStatusUpdate(req, res, data);
              return;
            } else {
              //create app notificaton
              var productData = {};
              productData.user = {};
              productData.user._id = product.seller._id;
              productData.user.fname = product.seller.fname;
              productData.productId = product._id;
              productData.message = product.name;
              if (dataToSet.assetStatus == 'sold')
                productData.notificationFor = "Sold";
              else if (dataToSet.assetStatus == 'rented')
                productData.notificationFor = "Rented";
              else if (product.status && dataToSet.assetStatus == 'listed')
                productData.notificationFor = "Approved";
              productData.imgsrc = product.assetDir + "/" + product.primaryImg;
              appNotificationCtrl.checkProductInCart(productData, function () {
                req.successProductArr[req.successProductArr.length] = product;
                req.counter++;
                bulkProductStatusUpdate(req, res, data);
              });

            }
          });
        }
      };

    })
  } else {
    return res.json({ successCount: req.successProductArr.length, errorList: req.errors });
  }
}

function checkValidTransition(tradeType, assetStatus) {
  var ret = false;
  if (tradeType == 'BOTH')
    ret = true;
  else if (tradeType == 'RENT' && assetStatus != 'sold')
    ret = true;
  else if (tradeType == 'SELL' && assetStatus != 'rented')
    ret = true;
  else if (tradeType == 'NOT_AVAILABLE' && assetStatus != 'not_available')
    ret = true;
  return ret;

}
//product import functionality
exports.importProducts = function (req, res) {
  var fileName = req.body.filename;
  //var user = req.body.user;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    console.log(e);
    return handleError(res, new Error("Error in file upload"))
  }
  if (!workbook)
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  req.counter = 0;
  req.numberOfCount = data.length;
  req.errors = [];
  //req.user = user;
  req.successProductArr = [];
  req.assetIdCache = {};
  importProducts(req, res, data);
}

function importProducts(req, res, data) {
  if (req.counter < req.numberOfCount) {
    var row = data[req.counter];
    var assetIdVal = row["Asset_ID*"];
    if (!assetIdVal) {
      var errorObj = {};
      errorObj['rowCount'] = req.counter + 2;
      errorObj['message'] = "Asset_ID is mandatory to be filled.";
      req.errors[req.errors.length] = errorObj;
      req.counter++;
      importProducts(req, res, data);
      return;
    }
    assetIdVal = trim(assetIdVal);
    if (req.assetIdCache[assetIdVal]) {
      var errorObj = {};
      errorObj['rowCount'] = req.counter + 2;
      errorObj['AssetId'] = assetIdVal;
      errorObj['message'] = "Duplicate Asset_ID " + assetIdVal + " in excel.";
      req.errors[req.errors.length] = errorObj;
      req.counter++;
      importProducts(req, res, data);
      return;
    } else {
      req.assetIdCache[assetIdVal] = true;
    }
    var product = {};
    Seq()
      .seq(function () {
        var self = this;
        Product.find({ assetId: assetIdVal }, function (err, products) {
          if (err) return handleError(res, err);
          if (products.length > 0) {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = assetIdVal + " Asset_ID is already exist.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
            return;
          } else {

            //product["assetId"] = trim(assetId);
            //self();
            IncomingProduct.find({ assetId: assetIdVal }, function (err, prds) {
              if (err) return handleError(res, err);
              if (prds.length > 0) {
                var errorObj = {};
                errorObj['rowCount'] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj['message'] = "Product with this Asset_Id is already exist in waiting queue.";
                req.errors[req.errors.length] = errorObj;
                req.counter++;
                importProducts(req, res, data);
                return;
              } else {
                product.assetId = assetIdVal;
                self();
              }
            });
          }
        })
      })
      .seq(function () {
        var self = this;
        var categoryName = row["Category*"];
        if (!categoryName) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Category is mandatory to be filled";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;

        }
        categoryName = trim(categoryName);
        var catTerm = new RegExp("^" + categoryName + "$", 'i');
        Category.find({ name: catTerm }, function (err, cats) {
          if (err) return handleError(res, err);
          if (cats.length > 0) {
            product.group = cats[0].group;
            product.category = {};
            product.category['_id'] = cats[0]['_id'] + "";
            product.category['name'] = categoryName;
            product["name"] = categoryName;
            if (categoryName == "Other") {
              var othCat = row["Other_Category*"];
              if (!othCat) {
                var errorObj = {};
                errorObj['rowCount'] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj['message'] = "Other_Category is mandatory to be filled";
                req.errors[req.errors.length] = errorObj;
                req.counter++;
                importProducts(req, res, data);
                return;
              }
              var ctg = getOtherObj(cats, "category");
              product.group = ctg.group;
              product.category['_id'] = ctg['_id'] + "";
              product.category['otherName'] = trim(othCat);
              product["name"] = product.category['otherName'];
            }
            self();
          } else {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj["message"] = "Category '" + categoryName + "' does not exist in master data.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
          }
        })


      })
      .seq(function () {
        var self = this;
        var brandName = row["Product_Brand*"];
        if (!brandName) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Product_Brand is mandatory to be filled";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;

        }
        brandName = trim(brandName);
        if (product.category['name'] == "Other" && brandName != "Other") {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Category '" + product.category['name'] + "' and  Brand '" + brandName + "' relation does not exist.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        var brTerm = new RegExp("^" + brandName + "$", 'i');
        var catTerm = new RegExp("^" + product.category.name + "$", 'i');
        if (brandName == "Other")
          catTerm = brTerm;

        Brand.find({ name: brTerm, 'category.name': catTerm }, function (err, brds) {
          if (err) return handleError(res, err);
          if (brds.length > 0) {
            product.brand = {};
            product.brand['_id'] = brds[0]['_id'] + "";
            product.brand['name'] = brandName;
            if (brandName == "Other") {
              var othBrand = row["Other_Brand*"];
              if (!othBrand) {
                var errorObj = {};
                errorObj['rowCount'] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj['message'] = "Other_Brand is mandatory to be filled.";
                req.errors[req.errors.length] = errorObj;
                req.counter++;
                importProducts(req, res, data);
                return;
              }
              var bd = getOtherObj(brds, "brand");
              product.brand['_id'] = bd['_id'] + "";
              product.brand['otherName'] = trim(othBrand);
              product["name"] += " " + product.brand['otherName'];
            } else {
              product["name"] += " " + brandName;
            }

            self();
          } else {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj["message"] = "Category, Brand relation does not exist in Master Data.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
          }
        })
      })
      .seq(function () {
        var self = this;

        var modelName = row["Product_Model*"];
        if (!modelName) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Product_Model is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        modelName = trim(modelName);
        if (product.brand['name'] == "Other" && modelName != "Other") {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Brand, Model relation does not exist in Master Data.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        var mdTerm = new RegExp("^" + modelName + "$", 'i');
        var brTerm = new RegExp("^" + product.brand.name + "$", 'i');
        var catTerm = new RegExp("^" + product.category.name + "$", 'i');
        if (modelName == "Other") {
          brTerm = mdTerm;
          catTerm = mdTerm;
        }
        Model.find({ name: mdTerm, 'category.name': catTerm, 'brand.name': brTerm }, function (err, models) {
          if (err) return handleError(res, err);
          if (models.length > 0) {
            product.model = {};
            product.model['_id'] = models[0]['_id'] + "";
            product.model['name'] = modelName;
            if (modelName == "Other") {
              var othModel = row["Other_Model*"];
              if (!othModel) {
                var errorObj = {};
                errorObj['rowCount'] = req.counter + 2;
                errorObj['AssetId'] = assetIdVal;
                errorObj['message'] = "Other_Model is mandatory to be filled.";
                req.errors[req.errors.length] = errorObj;
                req.counter++;
                importProducts(req, res, data);
                return;
              }
              var md = getOtherObj(models, "model");
              product.model['_id'] = md['_id'] + "";
              product.model['otherName'] = trim(othModel);
              product["name"] += " " + product.model['otherName'];
            } else {
              product["name"] += " " + modelName;
            }

            if (row["Variant"]) {
              product["name"] += " " + row["Variant"];
              product["variant"] = row["Variant"];
            }
            self();
          } else {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj["message"] = "Category, Brand, Model relation does not exist in Master Data.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
          }
        })
      })
      .seq(function () {
        var self = this;

        var subCategoryName = row["Sub_Category"] || "";
        subCategoryName = trim(subCategoryName);
        SubCategory.find({ name: subCategoryName }, function (err, subcategorys) {
          if (err) return handleError(res, err);
          if (subcategorys.length > 0) {
            product.subcategory = {};
            product.subcategory['_id'] = subcategorys[0]['_id'] + "";
            product.subcategory['name'] = subCategoryName;
          }
          self();
        })
      })
      .seq(function () {
        var self = this;
        var sellerMobile = row["Seller_Mobile*"];
        if (!sellerMobile) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Seller_Mobile is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        sellerMobile = trim(sellerMobile)
        User.find({ mobile: sellerMobile, deleted: false }, function (err, usrs) {
          if (err) return handleError(res, err);
          if (usrs.length > 0) {
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
          } else {
            var errorObj = {};
            errorObj["rowCount"] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj["message"] = "Seller_Mobile does not exist in the syatem.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
          }
        })
      })
      .seq(function () {
        var self = this;
        product["createdAt"] = new Date();
        product["updatedAt"] = new Date();
        product["relistingDate"] = new Date();
        var country = row["Country*"];
        if (!country) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Country is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }

        product["country"] = trim(country);
        product["operatingHour"] = trim(row["Motor_Operating_Hours"] || "");
        product["mileage"] = trim(row["Mileage"] || "");
        product["serialNo"] = trim(row["Machine_Serial_No"] || "");

        var tradeType = row["Trade_Type*"];
        if (!tradeType) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Trade_Type is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        tradeType = trim(tradeType);
        if (['RENT', 'SELL', 'BOTH'].indexOf(tradeType) == -1) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Trade_Type should have a value selected from its picklist only.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }

        product["tradeType"] = trim(tradeType);
        if (tradeType != "RENT") {
          var gp = row["Gross_Price*"];
          var prOnReq = row["Price_on_Request*"];
          var cr = row["Currency*"];
          if (gp && cr) {
            product["grossPrice"] = Number(trim(gp));
            product["currencyType"] = trim(cr);
          } else {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = "Gross_Price and Currency is mandatory to filled.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
            return;
          }
          if (!prOnReq) {
            product["priceOnRequest"] = false;
          } else {

            prOnReq = trim(prOnReq).toLowerCase();
            if (prOnReq == 'yes' || prOnReq == 'y') {
              product["priceOnRequest"] = true;
            } else {
              product["priceOnRequest"] = false;
            }
          }

        }

        product["productCondition"] = trim(row["Product_Condition"] || "").toLowerCase();

        var engRepOver = trim(row["Engine_Repaired_Overhauling"] || "").toLowerCase();
        product["isEngineRepaired"] = engRepOver == 'yes' || engRepOver == 'y' ? true : false;
        var state = row["State*"];
        if (!state) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "State is mandatory to filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        product["state"] = trim(state);

        var location = row["Location*"];
        if (!location) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = "Location is mandatory to be filled.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;
        }
        product["city"] = trim(location);
        product["comment"] = trim(row["Comments"] || "");
        var mfgYear = trim(row["Manufacturing_Year*"] || "");
        if (!mfgYear || mfgYear.length != 4) {
          var errorObj = {};
          errorObj['rowCount'] = req.counter + 2;
          errorObj['AssetId'] = assetIdVal;
          errorObj['message'] = " Manufacturing_Year should be in YYYY format.";
          req.errors[req.errors.length] = errorObj;
          req.counter++;
          importProducts(req, res, data);
          return;

        }
        product["mfgYear"] = mfgYear;

        product["isSold"] = false;
        product["status"] = false;
        product["expiryAlert"] = false;
        product["expired"] = false;
        product["deleted"] = false;
        var featured = trim(row["Featured"] || "").toLowerCase();
        product["featured"] = featured == 'yes' || featured == 'y' ? true : false;

        //rent info

        if (tradeType != "SELL") {
          product["rent"] = {};

          var rateTypeH = trim(row["Rent_Hours"] || "").toLowerCase();
          if (rateTypeH == "yes" || rateTypeH == 'y') {
            product["rent"].rateHours = {};
            product["rent"].rateHours.rateType = "hours";
          }

          var rateTypeD = trim(row["Rent_Days"] || "").toLowerCase();
          if (rateTypeD == "yes" || rateTypeD == 'y') {
            product["rent"].rateDays = {};
            product["rent"].rateDays.rateType = "days";
          }

          var rateTypeM = trim(row["Rent_Months"] || "").toLowerCase();
          if (rateTypeM == "yes" || rateTypeM == 'y') {
            product["rent"].rateMonths = {};
            product["rent"].rateMonths.rateType = "months";
          }
          var fromDate = new Date(row["Availability_of_Asset_From"]);
          var validDate = isValid(fromDate);

          if (!fromDate || !validDate) {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = "Availability_of_Asset_From date is blank or invalid to be filled.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
            return;
          }
          product["rent"].fromDate = fromDate;
          var toDate = new Date(row["Availability_of_Asset_To"]);
          validDate = isValid(fromDate);
          if (!toDate || !validDate) {
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = "Availability_of_Asset_To date is blank or invalid to be filled.";
            req.errors[req.errors.length] = errorObj;
            req.counter++;
            importProducts(req, res, data);
            return;
          }
          product["rent"].toDate = toDate;
          //rent hours
          var negotiableFlag = true;
          if (rateTypeH == "yes" || rateTypeH == 'y') {
            negotiableFlag = false;
            var minPeriodH = row["Min_Rental_Period_Hours"];
            if (!minPeriodH) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Min_Rental_Period_Hours is required to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateHours.minPeriodH = Number(trim(minPeriodH));

            var maxPeriodH = row["Max_Rental_Period_Hours"];
            if (!maxPeriodH) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Max_Rental_Period_Hours is required to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateHours.maxPeriodH = Number(trim(maxPeriodH));

            var rentAmountH = row["Rent_Amount_Hours"];
            if (!rentAmountH) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Rent_Amount_Hours is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateHours.rentAmountH = Number(trim(rentAmountH));

            var seqDepositH = row["Security_Deposit_Hours"];
            if (!seqDepositH) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Security_Deposit_Hours is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateHours.seqDepositH = Number(trim(seqDepositH));
          }
          // rent days
          if (rateTypeD == "yes" || rateTypeD == 'y') {
            negotiableFlag = false;
            var minPeriodD = row["Min_Rental_Period_Days"];
            if (!minPeriodD) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Min_Rental_Period_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateDays.minPeriodD = Number(trim(minPeriodD));

            var maxPeriodD = row["Max_Rental_Period_Days"];
            if (!maxPeriodD) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Max_Rental_Period_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateDays.maxPeriodD = Number(trim(maxPeriodD));

            var rentAmountD = row["Rent_Amount_Days"];
            if (!rentAmountD) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Rent_Amount_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateDays.rentAmountD = Number(trim(rentAmountD));

            var seqDepositD = row["Security_Deposit_Days"];
            if (!seqDepositD) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Security_Deposit_Days is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateDays.seqDepositD = Number(trim(seqDepositD));
          }
          //rent months
          if (rateTypeM == "yes" || rateTypeM == 'y') {
            negotiableFlag = false;
            var minPeriodM = row["Min_Rental_Period_Months"];
            if (!minPeriodM) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Min_Rental_Period_Months is mandatory to filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateMonths.minPeriodM = Number(trim(minPeriodM));

            var maxPeriodM = row["Max_Rental_Period_Months"];
            if (!maxPeriodM) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Max_Rental_Period_Months is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateMonths.maxPeriodM = Number(trim(maxPeriodM));

            var rentAmountM = row["Rent_Amount_Months"];
            if (!rentAmountM) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Rent_Amount_Months is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
              return;
            }
            product["rent"].rateMonths.rentAmountM = Number(trim(rentAmountM));

            var seqDepositM = row["Security_Deposit_Months"];
            if (!seqDepositM) {
              var errorObj = {};
              errorObj['rowCount'] = req.counter + 2;
              errorObj['AssetId'] = assetIdVal;
              errorObj['message'] = "Security_Deposit_Months is mandatory to be filled.";
              req.errors[req.errors.length] = errorObj;
              req.counter++;
              importProducts(req, res, data);
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
        product["technicalInfo"].bucketCapacity = trim(row["Bucket_Capacity"] || "");
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

        if (servicedate && validDate) {
          product["serviceInfo"][0].servicedate = servicedate;
        }

        //product["serviceInfo"][0].servicedate =  new Date(trim(row["Service_Date"] || "")) || "";
        product.user = req.body.user;
        product.images = [{}];
        IncomingProduct.create(product, function (err, pd) {
          if (err) {
            console.log("error in pushing prduct in queue", err);
            var errorObj = {};
            errorObj['rowCount'] = req.counter + 2;
            errorObj['AssetId'] = assetIdVal;
            errorObj['message'] = "Unknown error.";
            req.errors[req.errors.length] = errorObj;
          } else {
            req.successProductArr[req.successProductArr.length] = product;
          }
          req.counter++;
          importProducts(req, res, data);
        });
        //req.counter ++;
        //importProducts(req,res,data);
      })
  } else {
    res.status(200).json({ successCount: req.successProductArr.length, errorList: req.errors });
  }

}

function isValid(d) {
  return d.getTime() === d.getTime();
};

function getOtherObj(arr, term) {
  var objRef = null;
  var found = false;
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    switch (term) {
      case "model":
        if (item.group.name == "Other" && item.category.name == "Other" && item.brand.name == "Other") {
          objRef = item;
          found = true;
        }
        break;
      case "brand":
        if (item.group.name == "Other" && item.category.name == "Other") {
          objRef = item;
          found = true;
        }
        break;
      case "category":
        if (item.group.name == "Other") {
          objRef = item;
          found = true;
        }
        break;
    }
    if (found)
      break;
  }
  return objRef;
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  }
  catch (err) {
    return false;
  }
}

exports.createOrUpdateAuction = function (req, res) {
  Seq()
    .seq(function () {
      var self = this;
      if (!req.body.payment)
        self();
      else {

        PaymentTransaction.create(req.body.payment, function (err, paytm) {
          if (err) { return handleError(res, err) }
          else {
            req.payTransId = paytm._id;
            self();
          }
        })
      }
    })
    .seq(function () {
      var self = this;
      if (!req.body.valuation)
        self();
      else {

        if (req.payTransId)
          req.body.valuation.transactionId = req.payTransId + "";
        ValuationReq.create(req.body.valuation, function (err, vals) {
          if (err) { return handleError(res, err) }
          else {
            req.valuationId = vals._id;
            self();
          }
        })
      }
    })
    .seq(function () {
      var self = this;
      if (req.payTransId)
        req.body.auction.transactionId = req.payTransId + "";
      if (req.valuationId) {
        req.body.auction.valuation = {};
        req.body.auction.valuation._id = req.valuationId + "";
        req.body.auction.valuation.status = req.body.valuation.status;
      }

      if (req.body.auction._id) {
        AuctionReq.update({ _id: req.body.auction._id }, { $set: req.body.auction }, function (err, acts) {
          if (err) { return handleError(res, err) }
          else {
            req.auctionId = req.body.auction._id;
            self();
          }
        })
      } else {
        AuctionReq.create(req.body.auction, function (err, acts) {
          if (err) { return handleError(res, err); }
          else {
            req.auctionId = acts._id;
            self();
          }
        })
      }
    })
    .seq(function () {
      var self = this;
      var auctionUpdate = {};
      auctionUpdate._id = req.auctionId + "";
      if (req.body.auction.dbAuctionId)
        auctionUpdate.auction_id = req.body.auction.dbAuctionId;
      if (req.body.auction.lot_id)
        auctionUpdate.lot_id = req.body.auction.lot_id;
      if (req.valuationId)
        auctionUpdate.valuationId = req.valuationId + "";

      Product.update({ _id: req.body.auction.product._id }, { $set: { auction: auctionUpdate } }, function (err, prds) {
        if (err) { return handleError(res, err) }
        else {
          var resObj = {};
          resObj.auctionId = req.auctionId;
          if (req.payTransId)
            resObj.transactionId = req.payTransId;
          if (req.valuationId)
            resObj.valuationId = req.valuationId;
          res.status(200).json(resObj);
        }
      })
    })
}

//functionality for assigning  Uniq assetIds
exports.updateAssetId = function (req, res) {
  Product.find({ $or: [{ "assetId": "" }, { "assetId": { $exists: false } }] }, function (err, results) {
    if (err) { return handleError(res, err); }
    if (results.length > 0) {
      req.counter = 0;
      req.totalCount = results.length;
      req.products = results;
      updateAssetId(req, res);
    }
    else
      return handleError(res, "No record to update");
  });
}

function updateAssetId(req, res) {
  if (req.counter < req.totalCount) {
    var doc = req.products[req.counter];
    var uniqId = new Date().getTime();
    Product.find({ "assetId": uniqId }, function (err, prods) {
      if (err) return handleError(res, err);
      if (prods.length > 0) {
        updateAssetId(req, res);
        return;
      }
    });
    Product.update({ '_id': doc._id }, { $set: { "assetId": uniqId } }, function (err, result) {
      if (err) { return handleError(res, err) };
      req.counter++;
      updateAssetId(req, res);
    });
  } else
    res.status(200).send("successful updation of" + req.counter + " " + "records");

}

function handleError(res, err) {
  console.log(err);
  if (res instanceof Error) {
    var temp = res;
    res = err;
    err = temp;
  }
  return res.status(500).send(err);
}

