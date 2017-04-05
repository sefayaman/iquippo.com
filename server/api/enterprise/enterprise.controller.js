'use strict';

var _ = require('lodash');
var Seq = require("seq");
var EnterpriseValuation = require('./enterprisevaluation.model');
var EnterpriseValuationInvoice = require('./enterprisevaluationinvoice.model');

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
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','MM/DD/YY','YYYY/MM/DD',moment.ISO_8601];
var fieldsConfig = require('./fieldsConfig');
var purposeModel = require('../common/valuationpurpose.model');
var AssetGroupModel = require('./assetgroup.model');
var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
var validRequestType = ['Valuation','Insepection'];
var UserModel = require('../user/user.model');
var fs = require('fs');
var Handlebars = require('handlebars');
var pdf = require('html-pdf');
var validator = require('validator');
var minify = require('html-minifier').minify;


exports.get = function(req, res) {
  
  if(req.query.type == 'request')
    return getValuationRequest(req,res);
  else if(req.query.type == 'invoice')
    return getInvoice(req,res);
  else
    res.status(404).send('Not Found');

  
};

function getValuationRequest(req,res){
  
  var queryParam = req.query;
  var filter = {};
  filter['deleted'] = false;

  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': queryParam.searchStr
      }
  }
  if (queryParam._id)
    filter["_id"] = queryParam._id;
  if (queryParam.status){
    var stsArr = queryParam.status.split(',');
    filter["status"] = {$in:stsArr};
  }
  if (queryParam.mobile)
    filter["mobile"] = queryParam.mobile;
  if (queryParam.enterpriseId)
    filter["enterprise.enterpriseId"] = queryParam.enterpriseId;
  if (queryParam.agencyId)
    filter["agency._id"] = queryParam.agencyId;
  if (queryParam.requestType)
    filter["requestType"] = queryParam.requestType;
  if (queryParam.userId)
    filter["user._id"] = queryParam.userId;
  if (queryParam.invoiceNo)
    filter["invoiceNo"] = queryParam.invoiceNo;

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
}

function getInvoice(req,res){

  var queryParam = req.query;
  var filter = {};
  //filter['deleted'] = false;
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': queryParam.searchStr
      }
  }
  if (queryParam._id)
    filter["_id"] = queryParam._id;
  
  if (queryParam.status){
    var stsArr = queryParam.status.split(',');
    filter["status"] = {$in:stsArr};
  }

  if(queryParam.paymentReceived){
     filter["paymentReceived"] = queryParam.paymentReceived == 'n'?false:true;
  }
  if(queryParam.paymentMade){
     filter["paymentMade"] = queryParam.paymentMade == 'n'?false:true;
  }
  if (queryParam.enterpriseId)
    filter["enterprise.enterpriseId"] = queryParam.enterpriseId;
  if (queryParam.agencyId)
    filter["agency._id"] = queryParam.agencyId;
  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, EnterpriseValuationInvoice, filter, {});
    return;
  }

  var query = EnterpriseValuationInvoice.find(filter);
  query.exec(
    function(err, invoiceData) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(invoiceData);
    }

  );
}
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
exports.create = function(req, res, next){
  var bodyData = req.body;
  _getAssetGroupCategory(bodyData.assetCategory,bodyData.agency.partnerId,bodyData.enterprise.enterpriseId,function(acErr,result){
     if(acErr) { return handleError(res, err); }
     if(result && result.data){
      bodyData.valuerGroupId = result.data.valuerGroupId || "";
      bodyData.valuerAssetId = result.data.valuerAssetId || "";
     }
     if(result && !result.found)
      _createAssetGroupCategory(bodyData);
     EnterpriseValuation.create(bodyData, function(err, enterpriseData) {
        if(err) { return handleError(res, err); }
        return res.status(201).json(enterpriseData);
      });
  });  
 
}

function _getAssetGroupCategory(assetCategory,partnerId,enterpriseId,cb){
  var exTerm = "";
  var lkTerm = "";
  try{
    exTerm = {$regex: new RegExp( "^"+ assetCategory + "$", 'i')}
    lkTerm = {$regex: new RegExp( "^"+ assetCategory, 'i')}
  }catch(err){
    cb(err);
  }

    var filter = {};
    //filter.status = true;
    filter['enterpriseId'] = enterpriseId;
    filter['valuerCode'] = partnerId;
  async.parallel([equalMatch,likeMatch],onComplete);

  function likeMatch(callback){
    filter['assetCategory'] = lkTerm;
    AssetGroupModel.find(filter,function(err,likeRes){
      if(err){return callback(err)};
      callback(null,likeRes);
    });
  }

  function equalMatch(callback){
    filter['assetCategory'] = exTerm;
    AssetGroupModel.find(filter,function(err,eqRes){
      if(err){return callback(err)};
      callback(null,eqRes);
    });
  }

  function onComplete(err,results){
    if(err){return cb(err)}
    if(results.length > 0 && results[0].length > 0)
      cb(null,{data:results[0][0],found:true});
    else if(results.length > 1 && results[1].length > 0)
      cb(null,{data:results[1][0],found:false});
    else
      cb(null,{data:null,found:false});
  }
}

function _createAssetGroupCategory(bodyData){
  var assetGroup = {};
  assetGroup.status = false;
  assetGroup.deleted = false;
  assetGroup.createdBy = bodyData.createdBy;
  assetGroup.updatedBy = bodyData.createdBy;
  assetGroup.enterpriseId = bodyData.enterprise.enterpriseId;
  assetGroup.enterpriseName = bodyData.enterprise.name;
  assetGroup.assetCategory = bodyData.assetCategory;
  assetGroup.valuerName = bodyData.agency.name;
  assetGroup.valuerCode = bodyData.agency.partnerId;
  AssetGroupModel.create(assetGroup,function(err,result){
    if(err)
      console.log("err in asset group creation",err);
  })

}

function validateData(madnatoryParams,obj){
  var madnatoryParams = madnatoryParams || [];
  //var madnatoryParams = ['category','brand','model','country','state','city'];
  var err;
  madnatoryParams.some(function(x){
    if(!obj[x]){
      err = 'Missing Parameter:  ' + x;
      return false;
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
      return res.status(412).json({Err:'Missing madnatory parameter' + x });
  });

  var fileName = req.body.fileName;
  var user = req.body.user;
  //numericCols : ['customerTransactionId','customerValuationNo','customerPartyNo','engineNo','chassisNo','registrationNo','contactPersonTelNo']
  var ENTERPRISE_FIELD = 'enterpriseId';
  var options = {
    fileName : fileName,
    user : user,
    partnerType : 'ENTERPRISE',
    uploadType : 'UPLOAD',
    numericCols : [],
    dateParams : ['requestDate','repoDate'],
    madnatoryParams : ['partnerId','purpose','requestType','assetCategory','country','state','city','contactPerson','contactPersonTelNo']
  };
  
  if(user.role == 'admin')
    options.madnatoryParams.push(ENTERPRISE_FIELD);
  var parsedResult = parseExcel(options);
  var errObj = [];
  if(parsedResult.errObj && parsedResult.errObj.length)
    errObj = errObj.concat(parsedResult.errObj);
  var uploadData = parsedResult.uploadData;
  var totalCount = parsedResult.totalCount;

  if(!uploadData.length){
    var result = {
      errObj : errObj,
      msg : (totalCount - errObj.length) + ' out of ' + totalCount + ' uploaded sucessfully'
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
    async.parallel([validateEnterprise,validateRequestType,validatePurpose,validateAgency,validateMasterData,validateCountry],middleManProcessing);

    function validateEnterprise(callback){
      if(user.role== 'enterprise')
        row.enterpriseId = row.user.enterpriseId;
      UserModel.find({enterpriseId : row.enterpriseId,"enterprise" : true}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating enterprise');

        if(!result.length)
          return callback('Invalid enterprise');

        row.enterprise = {
          email : result[0].email,
          mobile : result[0].mobile,
          _id : result[0]._id,
          enterpriseId : result[0].enterpriseId,
          name : (result[0].fname || "") + " "+ (result[0].lname || "")
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
      vendorModel.find({partnerId : row.partnerId},function(err,result){
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
          partnerId : row.partnerId,
          name : result[0].entityName
        };

        return callback();
      })
    }

    function validateMasterData(callback){
       commonFunc.fetchBrand({name:row.brand},function(err,brands){
          if(err || !brands)
            return callback('Error while validating brand');

          if(!brands.length){
              row.otherBrand = row.brand;
              row.brand = "Other";
              row.otherModel = row.model;
              row.model = "Other";
              return callback();
          } 

          var modelParams = {
            brand : row.brand,
            name : row.model
          };          

          commonFunc.fetchModel(modelParams,function(err,model){
              if(err || !model)
                return callback('Error while validating model');

              if(!model.length){
                //return callback('Invalid Model'); 
                  row.otherModel = row.model;
                 row.model = "Other";           
              }
              return callback();
          });

            //return callback();
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

      row.customerPartyName = row.enterprise.name;
      row.customerPartyNo = row.enterprise.mobile;
      row.userName = user.userName;
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

      _getAssetGroupCategory(row.assetCategory,row.agency.partnerId,row.enterprise.enterpriseId,function(acErr,result){
           if(acErr) { return handleError(res, err); }
             if(result && result.data){
              row.valuerGroupId = result.data.valuerGroupId || "";
              row.valuerAssetId = result.data.valuerAssetId || "";
             }
             if(result && !result.found)
              _createAssetGroupCategory(row);

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
      })
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
      return res.status(412).json({Err:'Missing madnatory parameter' + x });
  });

  var fileName = req.body.fileName;
  var user = req.body.user;
  var updateType = req.body.updateType; 

  var options = {
    fileName : fileName,
    user : user,
    partnerType : 'ENTERPRISE',
    uploadType : 'MODIFY',
    numericCols : [],
    dateParams : ['requestDate','repoDate'],
    madnatoryParams : ['uniqueControlNo']
  };
  var enterpriseRoles = ['admin','enterprise'];
  if(updateType == 'agency'){
    options.partnerType = 'VALUATION_PARTNER';
    options.numericCols = ['assessedValue'];
    options.dateParams = ['reportDate'];
    options.madnatoryParams = ['uniqueControlNo','reportNo','reportDate','agencyYearOfManufacturing','hmr_kmr','assessedValue','inspectionBy','physicalCondition','reportUrl'];
  }
  
  var parsedResult = parseExcel(options);
  var errObj = [];
  if(parsedResult.errObj && parsedResult.errObj.length)
    errObj = errObj.concat(parsedResult.errObj);
  var uploadData = parsedResult.uploadData;
  var totalCount = parsedResult.totalCount;

  if(!uploadData.length){
    var result = {
      errObj : errObj,
       msg : (totalCount - errObj.length) + ' out of ' + totalCount + ' updated sucessfully'
    };

    return res.json(result);
  }

  async.eachLimit(uploadData,5,intitalize,finalize);

  function intitalize(row,cb){
    /*AA:
    * Process for bulk Upload(Enterprise and Admin users):
    * verify Request_Type,Purpose,Agency_Name
    * verfiy category brand and model 
    * verfiy country,state,location
    * if every thing is fine then upload data
    * validateCategory is for validating category,brand,model
    * validateCountry is for validating country,state,city
    */

    if(updateType == 'agency'){
      async.parallel([validateValuation],middleManProcessing)
    }else{
      async.parallel([validateEnterprise,validateValuation,validateRequestType,validatePurpose,validateAgency,validateMasterData,validateCountry],middleManProcessing);  
    }

    
    function validateEnterprise(callback){
      
      if(!row.enterpriseId)
        return callback();
      if(user.role== 'enterprise')
        row.enterpriseId = row.user.enterpriseId;

      UserModel.find({enterpriseId : row.enterpriseId,"enterprise" : true}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating enterprise');

        if(!result.length)
          return callback('Invalid enterprise');

        row.enterprise = {
          email : result[0].email,
          mobile : result[0].mobile,
          _id : result[0]._id,
          enterpriseId:result[0].enterpriseId,
          name : (result[0].fname || "") + " "+ (result[0].lname || "") 
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
        
        row.valData = result[0];
        if(updateType == 'agency'){
          if(user.role == 'admin')
            return callback();
          if(user.isPartner && user.partnerInfo && user.partnerInfo._id == result[0].agency._id)
              return callback();
          else
            return callback('User does not have privilege to update record');
        }else{
          var isValidForUpdate = enterpriseValidStatus.indexOf(result[0].status) != -1;
          if(isValidForUpdate && user.role == 'admin')
            return callback();
          else if(isValidForUpdate && user.enterpriseId == result[0].enterpriseId)
            return callback();
          else
             return callback('User does not have privilege to update record');
        }
        
       /* if(enterpriseValidStatus.indexOf(result[0].status) < 0 && user.role !== 'admin')
          return callback('User does not have privilege to update record');

        return callback();*/
      })
    }

    function validateRequestType(callback){
      if(!row.requestType)
        return callback();        
      if(validRequestType.indexOf(row.requestType) < 0)
        return callback('Invalid Request Type');

      return callback();
    }

    function validatePurpose(callback){
      if(!row.purpose)
        return callback();

      purposeModel.find({name : row.purpose}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating purpose');

        if(!result.length)
          return callback('Invalid Request Purpose');

        return callback();
      })
    }

    function validateAgency(callback){
      if(!row.agencyName)
        return callback();

      vendorModel.find({entityName : row.agencyName},function(err,result){
        if(err || !result)
          return callback('Error while validating Agency');

        if(!result.length)
          return callback('Invalid Agency');

        if(!result[0].services ||  result[0].services.indexOf("Valuation") < 0)
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

     function validateMasterData(callback){
      if(!row.brand)
        return callback();
       commonFunc.fetchBrand({name:row.brand},function(err,brands){
          if(err || !brands)
            return callback('Error while validating brand');

          if(!brands.length){
              row.otherBrand = row.brand;
              row.brand = "Other";
              row.otherModel = row.model;
              row.model = "Other";
              return callback();
          } 

          var modelParams = {
            brand : row.brand,
            name : row.model
          };          

          commonFunc.fetchModel(modelParams,function(err,model){
              if(err || !model)
                return callback('Error while validating model');

              if(!model.length){
                //return callback('Invalid Model'); 
                  row.otherModel = row.model;
                 row.model = "Other";           
              }
              return callback();
          });

            //return callback();
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
      if(!row.country)
        return callback();

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
      
      var valReq = row.valData;
      delete row.valData;
      if(updateType == 'agency'){

        row.status = EnterpriseValuationStatuses[4];
        row.statuses = valReq.statuses;
        row.statuses.push({
            createdAt : new Date(),
            status : EnterpriseValuationStatuses[4],
            userId : user._id
        });

        if(row.reportUrl){
          row['valuationReport'] = {
            external:true,
            filename:row.reportUrl
          }
        }
      }

      if(row.gpsInstalled){
        if(row.gpsInstalled.toLowerCase() === 'yes')
          row.gpsInstalled = true;
        else
          row.gpsInstalled = false;
      }

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
      msg : (totalCount - errObj.length) + ' out of ' + totalCount + ' updated sucessfully',
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

//Invoice functions
exports.createInvoice = function(req,res){
  EnterpriseValuationInvoice.create(req.body, function(err, enterpriseData) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(enterpriseData);
  });

}

exports.generateInvoice = function(req,res){
  var invoiceNo = req.params.invoiceNo;
  if(!invoiceNo){
    return res.status(412).json({Err:'Invalid invoice Number'});
  }
    
  EnterpriseValuationInvoice.find({invoiceNo: invoiceNo},function(err,invoiceData){
    if(err || !invoiceData)
      return res.send(err || new APIError(400,'Error while fetching invoice'));    

    fs.readFile(__dirname + '/../../views/emailTemplates/EValuation_Invoice.html', 'utf8', function(err, source) {
     if (err) {
        return handleError(res, err);
      }

      source = source.toString();
      //source += '</body></html>';
      var template = Handlebars.compile(source);

      var data = {
        invoiceNo : invoiceNo,
        invoiceDate : Utility.dateUtil.validateAndFormatDate(invoiceData.createdAt,'MM/DD/YYYY')
      };

      var result = template(data);
      var pdfInput = minify(result, {
        removeAttributeQuotes: true
      });

      var options = {
        height: "15.5in",        // allowed units: mm, cm, in, px 
        width: "10in",
        border: {
          "top": "2mm",            // default is 0, units: mm, cm, in, px 
          "right": "1mm",
          "bottom": "2mm",
          "left": "1.5mm"
        }
      };

      pdf.create(pdfInput, options).toStream(function (err, pdfOutput) {
        if (!err){
          res.setHeader('Content-disposition', 'inline; filename=invoice.pdf');
          res.setHeader('Content-type', 'application/pdf');
          pdfOutput.pipe(res);
        } else {
          res.send(new APIError(400,'Error while creating invoice'));
        }
      });
    });
  });
}

// Updates an existing enterprise valuation in the DB.
exports.updateInvoice = function(req, res) {
  //if(req.body._id) { delete req.body._id; }
  var _id = req.body._id;
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  EnterpriseValuationInvoice.findById(_id, function (err, invoice) {
    if (err) { return handleError(res, err); }
    if(!invoice) { return res.status(404).send('Not Found'); }
    EnterpriseValuationInvoice.update({_id:_id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).send("Invoice updated sucessfully");
    });
  });
};

var parameters = {
  jobID:{key:"jobId",required:true},
  unique_controll_no:{key:"uniqueControlNo",required:true},
  reportNo:{key:"reportNo",required:true},
  assetNo:{key:"assetNo"},
  imeiNo:{key:"gpsIMEINo"},
  hmr_Kmr:{key:"hmr_kmr"},
  assessed_Value:{key:"assessedValue",type:'numeric'},
  inspection_By:{key:"inspectionBy"},
  physical_Condition:{key:"physicalCondition"},
  gps_Installed:{key:"gpsInstalled",type:"boolean"},
  gps_Device_No:{key:"gpsDeviceNo"},
  yearOfManufacturing:{key:"agencyYearOfManufacturing"},
  engineNo:{key:"agencyEngineNo"},
  chasisNo:{key:"agencyChassisNo"},
  registrationNo:{key:"agencyRegistrationNo"},
  report_url:{key:"valuationReport",type:"file",required:true}
}

exports.updateFromAgency = function(req,res){
  
  var bodyData = req.body;
  console.log("request body  data",bodyData);

  var result = {};
  result['success'] = true;
  result['jobID'] = bodyData.jobID;
  result['unique_controll_no']= bodyData.unique_controll_no;
  var msg = validateRequest(bodyData);
  if(msg){
    result['msg'] = msg;
    result['success'] = false;
    return sendResponse();
  }

  checkRecordInDB(bodyData.unique_controll_no,function(msg,valReq){
    if(msg){
       result['msg'] = msg;
       result['status'] = false;
       return sendResponse();
    }else
        update(valReq);      

  })

  function update(valReq){

      var keys = Object.keys(parameters);
      var updateObj = {};
      keys.forEach(function(key){
        var val = bodyData[key];
        if(!parameters[key].type == 'boolean')
          val = val == 'YES' || val == 'yes'?true:false;
        if(parameters[key].type == 'file'){
          var valObj = {external:true};
          valObj.filename = val;
          val = valObj;
         }
        updateObj[parameters[key].key] = val;
       
      });

      updateObj.status = EnterpriseValuationStatuses[3];
      updateObj.statuses = valReq.statuses;
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = "IQVL";
      stsObj.status = EnterpriseValuationStatuses[3];
      if(updateObj.statuses)
        updateObj.statuses[updateObj.statuses.length] = stsObj;
       console.log("QV data upadted",updateObj);

       //return sendResponse();
      EnterpriseValuation.update({_id:valReq._id},{$set:updateObj},function(err){
          if(err){
             result['success'] = false;
             result['msg'] = "System error at iQuippo";
          }
          return sendResponse();
      });
  }

  function sendResponse(){
    res.status(200).json(result);
  }

  function checkRecordInDB(unCtlNo,cb){
    EnterpriseValuation.find({uniqueControlNo:unCtlNo},function(err,valArr){
      var msg = "";
      if(err){
         msg = "System error at iQuippo";
      }else if(valArr.length == 0){
          msg = "Record not found at iQuippo";
      }
      if(msg)
        return cb(msg);
      else  
        return cb(null,valArr[0]);
    })
  }

  function validateRequest(reqData){
    
    var msg = "";
    var keys = Object.keys(parameters);
    for(var i=0;i < keys.length;i++){

      var key = keys[i];
      var keyObj = parameters[key];

      //console.log("key obj",keyObj);

      var value = reqData[key];
      if(keyObj.required && !value){
        msg = key + " is missing";
        break;
      }

      if(keyObj.type){
        var retVal = valiadeDataType(value,keyObj.type);
          if(!retVal){
            msg = key + " must be of " + keyObj.type + " type";
        }
      }

    }
    return msg;
  }

}



function valiadeDataType(val,type){
  var ret = true; 
  switch(type){
    case"numeric":
      ret = !isNaN(val);
    break;
    case "file":
      ret = true;
    break;
  }
  return ret;
}

exports.exportExcel = function(req,res){
  var queryParam = req.query;
  var filter = {};
  if(queryParam.enterpriseId)
    filter['enterprise.enterpriseId'] = queryParam.enterpriseId;
  if(queryParam.agencyId)
    filter['agency._id'] = queryParam.agencyId;
  if(queryParam.ids){
    var ids = queryParam.ids.split(',');
    filter['_id'] = {$in:ids};
  }

  switch(queryParam.type){
    case "transaction":
      var fieldMap = fieldsConfig["TRANSACTION_EXPORT"];
      var query = EnterpriseValuation.find(filter).sort({createdAt:-1});
      query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          exportExcel(req,res,fieldMap,dataArr);
      })
      break;
    case 'invoice':
      var fieldMap = fieldsConfig["INVOICE_EXPORT"];
      var query = EnterpriseValuationInvoice.find(filter).sort({createdAt:-1});
       query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          exportExcel(req,res,fieldMap,dataArr);
      })
       break;
    case 'paymentmade':
       var fieldMap = fieldsConfig["EXPORT_PAYMENT"];
       filter['paymentMade'] = true;
      var query = EnterpriseValuationInvoice.find(filter).sort({createdAt:-1});
       query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          var jsonArr = [];
          dataArr.forEach(function(item,index){
             if(item.paymentMadeDetail && item.paymentMadeDetail.paymentDetails){
              item.paymentMadeDetail.paymentDetails.forEach(function(innerItem){
                _formatPayments(item,innerItem,jsonArr);
              })
            }
          })
          console.log("payment made",jsonArr);
          exportExcel(req,res,fieldMap,jsonArr);
      })
      break;
    case "paymentreceived":
      var fieldMap = fieldsConfig["EXPORT_PAYMENT"];
      filter['paymentReceived'] = true;
      var query = EnterpriseValuationInvoice.find(filter).sort({createdAt:-1});
       query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          var jsonArr = [];
          dataArr.forEach(function(item,index){
            if(item.paymentReceivedDetail && item.paymentReceivedDetail.paymentDetails){
              item.paymentReceivedDetail.paymentDetails.forEach(function(innerItem){
                _formatPayments(item,innerItem,jsonArr);
              })
            }
            
          })
          exportExcel(req,res,fieldMap,jsonArr);
      })
      break;
      default:
        //exportTransaction(req,res);
  }

  function _formatPayments(item,innerItem,jsonArr){
    var obj = {};
    obj['invoiceNo'] = item.invoiceNo || "";
    obj['requestType'] = item.requestType || "";
    obj['enterpriseName'] = item.enterprise.enterpriseId || "";
    obj['enterpriseContactNo'] = item.enterprise.mobile|| "" ;
    obj['valuationPartnerName'] = item.agency.name || "" ;
    obj['valuationPartnerContactNo'] = item.agency.mobile || "";
    obj['bankName'] = innerItem.bankName || "";
    obj['branchName'] = innerItem.branchName || "";
    obj['chequeNo'] = innerItem.chequeNo || "";
    obj['chequeValue'] = innerItem.chequeValue || "";
    obj['chequeDate'] = innerItem.chequeDate || ""
    obj['deductedTds'] = innerItem.deductedTds || "";
    jsonArr.push(obj);
  }
  
}

function exportExcel(req,res,fieldMap,jsonArr){

  var queryParam = req.query;
  var role = queryParam.role;
  var dataArr = [];
  var headers = Object.keys(fieldMap);
  var allowedHeaders = [];
  for(var i=0;i < headers.length;i++){
      var hd = headers[i];
      var obj = fieldMap[hd];
      if(obj.allowedRoles && obj.allowedRoles.indexOf(role) == -1){
        continue;
      }
      allowedHeaders.push(hd);
  }

  dataArr.push(allowedHeaders);
  jsonArr.forEach(function(item,idx){
    dataArr[idx + 1] = [];
    allowedHeaders.forEach(function(header){
      var keyObj = fieldMap[header];
      var val = _.get(item,keyObj.key,'');
      if(keyObj.type && keyObj.type == 'boolean')
          val = val?'YES':'NO';
       dataArr[idx + 1].push(val);
    });

  });

  var ws = Utility.excel_from_data(dataArr,allowedHeaders);
  var ws_name = "entvaluation_" + new Date().getTime();
  var wb = Utility.getWorkbook();
  wb.SheetNames.push(ws_name);
  wb.Sheets[ws_name] = ws;
  var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
  res.end(wbout);
}

function handleError(res, err) {
  return res.status(500).send(err);
}