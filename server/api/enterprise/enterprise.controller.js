'use strict';

var _ = require('lodash');
var Seq = require("seq");
var trim = require('trim');
var EnterpriseValuation = require('./enterprisevaluation.model');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
//var ApiError = require('./../../components/_error.js');
//var config = require('./../../config/environment');
//var importPath = config.uploadPath + config.importDir + "/";
//var vendorModel = require('../vendor/vendor.model');

// Get list of auctions

//var APIError = require('../../components/_error');
//var async = require('async');
//var debug = require('debug')('api.auction');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD'];
var validTimeFormat = ['DD/MM/YYYY h:mmA','DD/MM/YYYY h:mm A','MM/DD/YYYY h:mm A'];

var dateUtil = {
  validateAndFormatDate: function(dateString, format) {
    var dateFormat = format || 'YYYY-MM-DD HH:mm:ss';
    var formattedDate = moment(dateString,format).format(dateFormat);
    if (formattedDate === 'Invalid date') {
      formattedDate = null;
    }
    return formattedDate;
  },
  isValidDateTime: function(dateTimeString, format) {
    if(!dateTimeString)
      return {_isValid : false}
    return moment(dateTimeString,format);
  }
}

exports.getAll = function(req, res) {
  EnterpriseValuation.find(function(err, enterpriseData) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(enterpriseData);
  });
};



// Get a single enterprise valuation data
exports.getOnId = function(req, res) {
  EnterpriseValuation.findById(req.params.id, function(err, enterpriseData) {
    if (err) {
      return handleError(res, err);
    }
    if (!enterpriseData) {
      return res.status(404).send('Not Found');
    }
    return res.json(enterpriseData);
  });
};

// Creates a new valuation in the DB.
exports.create = function(req, res, next) {
EnterpriseValuation.create(req.body, function(err, enterpriseData) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(enterpriseData);
  });
}

/*exports.bulkUpload = function(req, res, next) {
  var fileName = req.body.filename;
  var user = req.body.user;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    debug(e);
    return next(new APIError(400, 'Error while parsing excel sheet'));
  }

  if (!workbook)
    return next(new APIError(404, 'No Excel sheet found for upload'));

  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  var field_map = {
    'Auction_ID*': 'auctionId',
    'End_Date': 'endDate',
    'Asset_No.*': 'assetId',
    'Lot_No.*': 'lotNo',
    'Category*': 'category',
    'Brand*': 'brand',
    'Model*': 'model',
    'Asset_Description': 'description',
    'Invoice_Date': 'invioceDate',
    'Asset_Registration_No.': 'registrationNo',
    'Engine_No.': 'engineNo',
    'Asset_Location': 'city',
    'Original_Invoice': 'originalInvoice',
    'VAT%': 'vatPercentage',
    'Contact_Person': 'contactName',
    'Contact_No.': 'contactNumber',
    'Product_ID': 'productId',
    'Sold': 'isSold',
    'Sale Value': 'saleVal',
    'Start_Date': 'startDate'
  };

  var err;
  var uploadData = [];
  var errObj = [];
  var assetIdMap = {};

  data.forEach(function(x) {
    var obj = {};
    Object.keys(x).forEach(function(key) {
      obj[field_map[key]] = x[key];
    })
    obj.rowCount = x.__rowNum__;
    err = validateData(obj);
    if (err) {
      errObj.push({
        Error: err,
        rowCount: x.__rowNum__
      });
    } else {
      if(assetIdMap[obj.assetId]){
        errObj.push({
          Error : 'Duplicate Asset Id in uploaded sheet',
          rowCount : obj.rowCount
        })
      }else{
        
        assetIdMap[obj.assetId] = obj.auctionId;
        obj.user = user;
        
        ['isSold','originalInvoice'].forEach(function(x){
          if(obj[x] && obj[x].replace(/[^a-zA-Z ]/g, "").trim().toLowerCase() !== 'yes'){
            obj[x] = false;
          }
        })

        if(!obj.isSold){
          obj.saleVal = '';
        }

        if(!obj.originalInvoice){
          obj.invioceDate = '';
        }

        uploadData.push(obj);
      } 
    }
  });

  if(!uploadData.length){
     var result = {
        errObj : errObj
     };

    return res.json(result);
  }

  uploadReqCtrl.create({
    uploadData: uploadData,
    type: 'auction'
  }, function(err, result) {
    if (err)
      return res.sendStatus(500).send(err);
    if (errObj.length)
      result.errObj = result.errObj.concat(errObj);

    return res.json(result);
  });
};
*/
//search based on filter
exports.getOnFilter = function(req, res) {
  var filter = {};

  var orFilter = [];

  if (req.body.searchStr) {

    var term = new RegExp(req.body.searchStr, 'i');
    orFilter[orFilter.length] = {
      requestType: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      purpose: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      agencyName: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      enterpriseName: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      category: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      brand: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      model: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      assetId: {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      uniqueControlNo: {
        $regex: term
      }
    };
  }

  if (orFilter.length > 0) {
    filter['$or'] = orFilter;
  }

  if (req.body._id)
    filter["_id"] = req.body._id;
  if (req.body.mobile)
    filter["mobile"] = req.body.mobile;
  if (req.body.enterpriseName)
    filter["enterpriseName"] = req.body.enterpriseName;
  if (req.body.userId)
    filter["user._id"] = req.body.userId;
  if (req.body.pagination) {
    Utility.paginatedResult(req, res, EnterpriseValuation, filter, {});
    return;
  }

  var query = EnterpriseValuation.find(filter);
  query.exec(
    function(err, enterpriseData) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(enterpriseData);
    }

  );
};

// Updates an existing enterprise valuation in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  EnterpriseValuation.findById(req.params.id, function (err, enterprise) {
    if (err) { return handleError(res, err); }
    if(!enterprise) { return res.status(404).send('Not Found'); }
    EnterpriseValuation.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Enterprise valuation updated sucessfully"});
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}