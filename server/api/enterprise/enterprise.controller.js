'use strict';

var _ = require('lodash');
var Seq = require("seq");
var EnterpriseValuation = require('./enterprisevaluation.model');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var vendorModel = require('../vendor/vendor.model');

// Get list of auctions
var commonFunc = require('../common/uploadrequest/commonFunc');
var async = require('async');
var APIError = require('../../components/_error');
var debug = require('debug')('api.enterprise');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD',moment.ISO_8601];
var fieldsConfig = require('./fieldsConfig');
var purposeModel = require('../common/valuationpurpose.model');
var EnterpriseValuationStatuses = ['Request Initiated','Request Submitted','Request Failed','Valuation Request Submitted','Valuation Report Failed','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
var validRequestType = ['Valuation','Insepection'];
var UserModel = require('../user/user.model');

exports.get = function(req, res) {
  
  var queryParam = req.query;
  var filter = {};
  var orFilter = [];

  if (queryParam.searchStr) {

    var term = new RegExp(queryParam.searchStr, 'i');
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

  if (queryParam._id)
    filter["_id"] = queryParam._id;
  if (queryParam.status){
    var stsArr = queryParam.status.split(',');
    filter["status"] = {$in:stsArr};
  }
  if (queryParam.mobile)
    filter["mobile"] = queryParam.mobile;
  if (queryParam.enterpriseName)
    filter["enterpriseName"] = queryParam.enterpriseName;
  if (queryParam.userId)
    filter["user._id"] = queryParam.userId;
  if (queryParam.pagination) {
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

function validateData(options,obj){
  var madnatoryParams = options.madnatoryParams || [];
  //var madnatoryParams = ['category','brand','model','country','state','city'];
  var err;
  madnatoryParams.some(function(x){
    if(!obj[x]){
      err = 'Missing Parameter:  ' + x;
      return true;
    }
  });
  return err;
}

function parseExcel(options){  
  ['fileName','partnerType','uploadType'].forEach(function(x){
    if(!options[x])
      return new Error('Invalid Upload Type with missing : '+x);
  });

  var fileName = options.fileName;
  var partnerType = options.partnerType;
  var uploadType = options.uploadType;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    debug(e);
    return e;
  }

  if (!workbook)
    return new Error('No Excel sheet found for upload');

  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);
  var field_map = fieldsConfig[partnerType][uploadType];
  var err;
  var uploadData = [];
  var errObj = [];
  // var assetIdMap = {};
  var totalCount = data.length;
  data.forEach(function(x) {
    var obj = {};
    Object.keys(x).forEach(function(key) {
      obj[field_map[key]] = x[key];
    })
    obj.rowCount = x.__rowNum__;
    err = validateData(options.madnatoryParams,obj);
    if (err) {
      errObj.push({
        Error: err,
        rowCount: x.__rowNum__
      });
    } else {
        obj.user = options.user;
        var numericCols = options.numericCols || [];
        var dateParams = options.dateParams || [];
        //var numericCols = ['customerTransactionId','customerValuationNo','customerPartyNo','engineNo','chassisNo','registrationNo','contactPersonTelNo'];

        numericCols.forEach(function(x){
          if(obj[x] && isNaN(obj[x])){
            delete obj[x];
          }
        });

        //var dateParams = ['requestDate','invoiceDate','repoDate'];
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

  return {
    errObj : errObj,
    totalCount : totalCount,
    uploadData : uploadData
  };
}

exports.bulkUpload = function(req, res) {
  var body = req.body;
  ['fileName','user'].forEach(function(x){
    if(!body[x])
      return res.send(412).json({Err:'Missing madnatory parameter' + x });
  });

  var fileName = req.body.fileName;
  var user = req.body.user;
  var options = {
    fileName : fileName,
    user : user,
    partnerType : 'ENTERPRISE',
    uploadType : 'UPLOAD',
    numericCols : ['customerTransactionId','customerValuationNo','customerPartyNo','engineNo','chassisNo','registrationNo','contactPersonTelNo'],
    dateParams : ['requestDate','invoiceDate','repoDate'],
    madnatoryParams : ['agencyName','purpose','requestType','enterpriseName','category','brand','model','country','state','city']
  };
  
  var parsedResult = parseExcel(options);
  var errObj = [];
  if(parsedResult.errObj && parsedResult.errObj.length)
    errObj = errObj.concat(parsedResult.errObj);
  var uploadData = parsedResult.uploadData;
  var totalCount = parsedResult.totalCount;

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
    * verify Request_Type,Purpose,Agency_Name
    * verfiy category brand and model 
    * verfiy country,state,location
    * if every thing is fine then upload data
    * validateCategory is for validating category,brand,model
    * validateCountry is for validating country,state,city
    */
    async.parallel([validateEnterprise,validateRequestType,validatePurpose,validateAgency,validateCategory,validateCountry],middleManProcessing);

    function validateEnterprise(callback){
      UserModel.find({enterpriseName : row.enterpriseName,"enterprise" : true}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating enterprise');

        if(!result.length)
          return callback('Invalid enterprise');

        row.enterprise = {
          email : result[0].email,
          mobile : result[0].mobile,
          _id : result[0]._id,
          name : result[0].enterpriseName
        };

        return callback();
      });
    }

    function validateRequestType(callback){
      if(validRequestType.indexOf(row.requestType) < 0)
        return callback('Invalid Request Type');

      return callback();
    }

    function validatePurpose(callback){
      purposeModel.find({name : row.purpose}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating purpose');

        if(!result.length)
          return callback('Invalid Request Purpose');

        return callback();
      })
    }

    function validateAgency(callback){
      vendorModel.find({entityName : row.agencyName},function(err,result){
        if(err || !result)
          return callback('Error while validating Agency');

        if(!result.length)
          return callback('Invalid Agency');

        if(!result[0].services ||  result[0].services.indexOf(row.requestType) < 0)
          return callback('Agency not authorized for Request Type');

        row.agency = {
          email : result[0].user.email,
          mobile : result[0].user.mobile,
          _id : result[0]._id,
          name : result[0].entityName
        };

        return callback();
      })
    }

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

      row.createdBy = {
        name : user.userName,
        _id : user._id,
        role : user.role
      };

      row.statuses = [{
        createdAt : new Date(),
        status : EnterpriseValuationStatuses[0],
        userId : user._id
      }]

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
};


exports.bulkModify = function(req, res) {
  var body = req.body;
  ['fileName','user'].forEach(function(x){
    if(!body[x])
      return res.send(412).json({Err:'Missing madnatory parameter' + x });
  });

  var fileName = req.body.fileName;
  var user = req.body.user;
  var options = {
    fileName : fileName,
    user : user,
    partnerType : 'ENTERPRISE',
    uploadType : 'MODIFY',
    numericCols : ['customerTransactionId','customerValuationNo','customerPartyNo','engineNo','chassisNo','registrationNo','contactPersonTelNo'],
    dateParams : ['requestDate','invoiceDate','repoDate'],
    madnatoryParams : ['uniqueControlNo','agencyName','purpose','enterpriseName','requestType','category','brand','model','country','state','city']
  };
  
  var parsedResult = parseExcel(options);
  var errObj = [];
  if(parsedResult.errObj && parsedResult.errObj.length)
    errObj = errObj.concat(parsedResult.errObj);
  var uploadData = parsedResult.uploadData;
  var totalCount = parsedResult.totalCount;

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
    * verify Request_Type,Purpose,Agency_Name
    * verfiy category brand and model 
    * verfiy country,state,location
    * if every thing is fine then upload data
    * validateCategory is for validating category,brand,model
    * validateCountry is for validating country,state,city
    */
    async.parallel([validateEnterprise,validateValuation,validateRequestType,validatePurpose,validateAgency,validateCategory,validateCountry],middleManProcessing);

    function validateEnterprise(callback){
      UserModel.find({enterpriseName : row.enterpriseName,"enterprise" : true}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating enterprise');

        if(!result.length)
          return callback('Invalid enterprise');

        row.enterprise = {
          email : result[0].email,
          mobile : result[0].mobile,
          _id : result[0]._id,
          name : result[0].enterpriseName
        };

        return callback();
      });
    }

    function validateValuation(callback){
      EnterpriseValuation.find({uniqueControlNo : row.uniqueControlNo}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating valuation request');

        if(!result.length)
          return callback('Invalid Valuation request');

        var enterpriseValidStatus = [EnterpriseValuationStatuses[0],EnterpriseValuation[1]];

        if(enterpriseValidStatus.indexOf(result[0].status) < 0 && user.role !== 'admin')
          return callback('Enterprise user does not have privilege to update record');

        return callback();
      })
    }

    function validateRequestType(callback){
      if(validRequestType.indexOf(row.requestType) < 0)
        return callback('Invalid Request Type');

      return callback();
    }

    function validatePurpose(callback){
      purposeModel.find({name : row.purpose}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating purpose');

        if(!result.length)
          return callback('Invalid Request Purpose');

        return callback();
      })
    }

    function validateAgency(callback){
      vendorModel.find({entityName : row.agencyName},function(err,result){
        if(err || !result)
          return callback('Error while validating Agency');

        if(!result.length)
          return callback('Invalid Agency');

        if(!result[0].services ||  result[0].services.indexOf(row.requestType) < 0)
          return callback('Agency not authorized for Request Type');

        row.agency = {
          email : result[0].user.email,
          mobile : result[0].user.mobile,
          _id : result[0]._id,
          name : result[0].entityName
        };

        return callback();
      })
    }

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

      var uniqueControlNo = row.uniqueControlNo;
      delete row.uniqueControlNo;

      EnterpriseValuation.update({uniqueControlNo : uniqueControlNo},{$set:row}, function(err, enterpriseData) {
        console.log(err);
        if(err || !enterpriseData) { 
          errObj.push({
            Error: 'Error while updating data',
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

exports.bulkUpdate = function(req,res){
  var dataArr = req.body;
  bulkUpdate(dataArr,function(err){
    if (err) { return handleError(res, err); }
     return res.status(200).send("Enterprise valuations updated sucessfully");
  })
}

function bulkUpdate(dataArr,cb){
    async.eachLimit(dataArr,5,update,cb);
    function update(dt,callback){
      var _id = dt._id;
      delete dt._id;
       EnterpriseValuation.update({_id:_id},{$set:dt},function(err){
        callback(err)
      });
    }
}

function handleError(res, err) {
  return res.status(500).send(err);
}