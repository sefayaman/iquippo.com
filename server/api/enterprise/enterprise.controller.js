'use strict';

var _ = require('lodash');
var Seq = require("seq");
var EnterpriseValuation = require('./enterprisevaluation.model');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
//var vendorModel = require('../vendor/vendor.model');

// Get list of auctions
var commonFunc = require('../common/uploadrequest/commonFunc');
var async = require('async');
var APIError = require('../../components/_error');
var debug = require('debug')('api.enterprise');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD',moment.ISO_8601];

var EnterpriseValuationStatuses = ['Request Initiated','Request Submitted','Request Failed','Valuation Request Submitted','Valuation Report Failed','Invoice Generated','Payment Received','Payment Made to valuation Partner'];

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

function validateData(obj){
  var madnatoryParams = ['category','brand','model','country','state','city'];
  var err;
  madnatoryParams.some(function(x){
    if(!obj[x]){
      err = 'Missing Parameter:  ' + x;
      return true;
    }
  });
  return err;
}

exports.bulkUpload = function(req, res, next) {
  var body = req.body;
  ['fileName','user','requestType','purpose','agencyName'].forEach(function(x){
    if(!body[x])
      return res.send(412).json({Err:'Missing madnatory parameter' + x });
  });

  var fileName = req.body.fileName;
  var user = req.body.user;
  var requestType = req.body.requestType;
  var purpose = req.body.purpose;
  var agencyName = req.body.agencyName;
  
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
  var enterprise_field_map = {
    'Enterprise_Name': 'enterpriseName',
    'Customer_Transaction_ID': 'customerTransactionId',
    'Customer_Valuation_Number': 'customerValuationNo',
    'Customer_Party_No': 'customerPartyNo',
    'Customer_Party_Name': 'customerPartyName',
    'User_Name': 'user',
    'Request_Date': 'requestDate',
    'Asset_No': 'assetId',
    'Repo_Date': 'repoDate',
    'Asset_Type/Category*': 'category',
    'Make/Brand*': 'brand',
    'Model*': 'model',
    'Asset_Description': 'assetDescription',
    'Engine_No': 'engineNo',
    'Chassis_No': 'chassisNo',
    'Registration_No': 'registrationNo',
    'Invoice_Date': 'invoiceDate',
    'Yard_Parked': 'yardParked',
    'Country*': 'country',
    'State*': 'state',
    'Location*': 'city',
    'Contact_Person': 'contactPerson',
    'Contact_Person_Tel_No': 'contactPersonTelNo',
    'Distance_from_Customer_Office': 'disFromCustomerOffice'
  };



   var err;
   var uploadData = [];
   var errObj = [];
  // var assetIdMap = {};
  var totalCount = data.length;
  data.forEach(function(x) {
    var obj = {};
    Object.keys(x).forEach(function(key) {
      obj[enterprise_field_map[key]] = x[key];
    })
    obj.rowCount = x.__rowNum__;
    err = validateData(obj);
    if (err) {
      errObj.push({
        Error: err,
        rowCount: x.__rowNum__
      });
    } else {
        obj.user = user;
        obj.agencyName = agencyName;
        obj.requestType = requestType;
        obj.purpose = purpose;

        var numericCols = ['customerTransactionId','customerValuationNo','customerPartyNo','engineNo','chassisNo','registrationNo','contactPersonTelNo'];

        numericCols.forEach(function(x){
          if(obj[x] && isNaN(obj[x])){
            delete obj[x];
          }
        });

        var dateParams = ['requestDate','invoiceDate','repoDate'];
        dateParams.forEach(function(x){
          if(obj[x]){
            var d = Utility.dateUtil.isValidDateTime(obj[x],validDateFormat);
            if(d.isValid()){
              obj[x] = new Date(Utility.dateUtil.validateAndFormatDate(d,'MM/DD/YYYY'));
            } else {
              delete obj[x];
            }
          }
        });

        var validData = {};
        Object.keys(obj).forEach(function(x){
          if(obj[x])
            validData[x] = obj[x];
        });
        uploadData.push(validData);
      }
  });

  if(!uploadData.length){
    var result = {
      errObj : errObj
    };

    return res.json(result);
  }

  async.eachLimit(uploadData,5,intitalize,finalize);

  function intitalize(row,cb){
    /*AA:
    * Process for bulk Upload:
    * verfiy category brand and model 
    * verfiy country,state,location
    * if every thing is fine then upload data
    * validateCategory is for validating category,brand,model
    * validateCountry is for validating country,state,city
    */
    async.parallel([validateCategory,validateCountry],middleManProcessing);

    function validateCategory(callback){
      commonFunc.fetchCategory(row.category,function(err,category){
        if(err || !category)
          return callback('Error while validating category');

        if(!category.length)
          return callback('Invalid Category');

        var brandParams = {
          group : category[0]._doc.group.name,
          category : row.category,
          name : row.brand
        };

        commonFunc.fetchBrand(brandParams,function(err,brand){
          if(err || !brand)
            return callback('Error while validating brand');

          if(!brand.length)
            return callback('Invalid Brand');

          var modelParams = {
            group : category[0]._doc.group.name,
            category : row.category,
            brand : row.brand,
            name : row.model
          };          

          commonFunc.fetchModel(modelParams,function(err,model){
            if(err || !model)
              return callback('Error while validating model');

            if(!model.length)
              return callback('Invalid Model');            
            });

            return callback();
        })
      })
    }

    function validateCountry(callback){
      var countryParams = {
        name : row.country
      };

      commonFunc.fetchCountry(countryParams,function(err,country){
        if(err || !country)
          return callback('Error while validating country');

        if(!country.length)
          return callback('Invalid Country');

        var stateParams = {
          country : row.country,
          name : row.state
        };

        commonFunc.fetchStates(stateParams,function(err,state){
          if(err || !state)
          return callback('Error while validating state');

          if(!state.length)
            return callback('Invalid State');

          var cityParams = {
              'state.name' : row.state,
              'state.country' :row.country,
              name : row.city
          };

          commonFunc.fetchCities(cityParams,function(err,city){
            if(err || !city)
              return callback('Error while validating city');

            if(!city.length)
              return callback('Invalid City');

            return callback();
          })
        })        
      });
    }

    function middleManProcessing(err,result){
      debug(result);
      if(err){
        errObj.push({
          Error: err,
          rowCount: row.rowCount
        });
        return cb();
      }

      EnterpriseValuation.create(row, function(err, enterpriseData) {
        console.log(err);
        if(err || !enterpriseData) { 
          errObj.push({
            Error: 'Error while inserting data',
            rowCount: row.rowCount
          });
        }
        return cb();
      });
    }
  }


  function finalize(err){
    debug(err);

    return res.json({
      msg : (totalCount - errObj.length) + ' out of ' + totalCount + ' uploaded sucessfully',
      errObj : errObj 
    });
  }
 

  // uploadReqCtrl.create({
  //   uploadData: uploadData,
  //   type: 'auction'
  // }, function(err, result) {
  //   if (err)
  //     return res.sendStatus(500).send(err);
  //   if (errObj.length)
  //     result.errObj = result.errObj.concat(errObj);

  //   return res.json(result);
  // });
};

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