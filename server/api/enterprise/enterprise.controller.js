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
var validRequestType = ['Valuation','Inspection'];
var UserModel = require('../user/user.model');
var fs = require('fs');
var Handlebars = require('handlebars');
var pdf = require('html-pdf');
var validator = require('validator');
var minify = require('html-minifier').minify;
var commonController = require('./../common/common.controller');
var notification = require('./../../components/notification.js');
var VALUATION_REQUEST = "ValuationRequest";
var VALUATION_REPORT_SUBMISSION= "ValuationReportSubmission";
var DEFAULT_PURPOSE = "Financing";

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
        '$search': "\""+queryParam.searchStr+"\""
      }
  }
  if (queryParam._id)
    filter["_id"] = queryParam._id;
  if (queryParam.status){
    var stsArr = queryParam.status.split(',');
    filter["status"] = {$in:stsArr};
  }
   if (queryParam.statusType)
    filter["status"] = queryParam.statusType;
  if (queryParam.mobile)
    filter["mobile"] = queryParam.mobile;
  if (queryParam.enterpriseId)
    filter["enterprise.enterpriseId"] = queryParam.enterpriseId;
  if (queryParam.agencyId)
    filter["agency._id"] = queryParam.agencyId;
  if (queryParam.requestType)
    filter["requestType"] = queryParam.requestType;
  if (queryParam.userId)
    filter["createdBy._id"] = queryParam.userId;
  if (queryParam.invoiceNo)
    filter["invoiceNo"] = queryParam.invoiceNo;

    var dateFilter = {};
    if(queryParam.fromDate)
      dateFilter.$gte = new Date(queryParam.fromDate);
    if(queryParam.toDate){
      var toDate = new Date(queryParam.toDate);
      var nextDay = toDate.getDate() + 1;
      toDate.setDate(nextDay);
      dateFilter.$lt = toDate;
    }
    if(queryParam.fromDate || queryParam.toDate)
      filter['createdAt'] = dateFilter;

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
  
  var dateFilter = {};
  if(queryParam.fromDate)
    dateFilter['$gte'] = new Date(queryParam.fromDate);
  if(queryParam.toDate)
    dateFilter['$lt']= new Date(queryParam.toDate);
  if(queryParam.fromDate || queryParam.toDate)
    filter['createdAt'] = dateFilter;

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

    var mandatoryParams =  ['agency.partnerId','agency.partnerId','purpose','requestType','assetCategory',"yardParked",'country','state','city','contactPerson','contactPersonTelNo','assetDescription'];
    var vehicleParamsArr = ['engineNo','chassisNo','registrationNo','serialNo'];

    var returnVal = mandatoryParams.every(function(key){  
        var val = _.get(req.body,key,"");
        if(val)
          return true;
    });

    if(!returnVal)
      return res.status(422).send("Missing some required parameter.");

    returnVal = vehicleParamsArr.some(function(key){
      var val = _.get(req.body,key,"");
        if(val)
          return true;
    });

    if(!returnVal)
      return res.status(422).send("Missing some required parameter.");
    
    var bodyData = req.body;

    async.series({one:upsertAssetGroupCategory,two:_create},onComplete);

    function upsertAssetGroupCategory(cb){

      _getAssetGroupCategory(bodyData.assetCategory,bodyData.agency.partnerId,bodyData.enterprise.enterpriseId,function(err,result){
          if(err) { return cb(err); }
         if(result && result.data){
            bodyData.valuerGroupId = result.data.valuerGroupId || "";
            bodyData.valuerAssetId = result.data.valuerAssetId || "";
          }
         if(result && !result.found)
            _createAssetGroupCategory(bodyData.createdBy,bodyData.assetCategory,bodyData.enterprise.enterpriseId,bodyData.agency.partnerId);
          return cb();
      }); 

    }

    function _create(cb){
      delete bodyData.requestDate;
      EnterpriseValuation.create(bodyData, function(err, enterpriseData) {
        return cb(err,enterpriseData);
      });
    }

    function onComplete(err,result){
      if(err)
        return handleError(res, err);
      return res.status(201).json(result.two);
    }
 
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
      cb(null,{data:{},found:false});
  }
}

function _createAssetGroupCategory(userData,assetCategory,enterpriseId,partnerId){
  
  var assetGroup = {};
  assetGroup.status = false;
  assetGroup.deleted = false;

 assetGroup.createdBy = userData;
  assetGroup.updatedBy = userData;
  assetGroup.assetCategory = assetCategory;

  async.parallel([getEnterprise,getAgency],finalize);

  function getEnterprise(callback){
    if(!enterpriseId)
      return callback("There is no enterpriseId");

    UserModel.find({enterpriseId : enterpriseId,"enterprise" : true}).exec(function(err,result){
      if(err){return callback(err);}
      assetGroup.enterpriseId = enterpriseId;
      if(result && result.length > 0)
      assetGroup.enterpriseName = result[0].fname + " " + result[0].mname;
      return callback();
    });
  }

  function getAgency(callback){
    if(!enterpriseId)
       return callback("There is no partnerId");

    vendorModel.find({partnerId :partnerId},function(err,result){
      if(err){return callback(err);}
      if(result && result.length > 0)
          assetGroup.valuerName = result[0].entityName;
      assetGroup.valuerCode = partnerId;
      return callback();
    });
  }

  function finalize(){
    AssetGroupModel.create(assetGroup,function(err,result){
      if(err)
        console.log("err in asset group creation",err);
    });
  }
}

function validateData(options,obj){

  var madnatoryParams = options.madnatoryParams || [];
  var numericCols = options.numericCols || [];
  var dateParams = options.dateParams || [];
  var madnatorySpecialParams = options.madnatorySpecialParams || [];
  var err;
  numericCols.forEach(function(x){
    if(obj[x] && isNaN(obj[x])){
      delete obj[x];
    }
  });

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

  madnatoryParams.some(function(x){
    if(!obj[x]){
      err = 'Missing Parameter:  ' + fieldsConfig.REVERS_MAPPING[x];
      return false;
    }
  });

  var found = false;
  var msgStr = "";

  madnatorySpecialParams.some(function(x){
  if(obj[x]){
    found = true;
    return true;
  }
  msgStr += fieldsConfig.REVERS_MAPPING[x] + ",";
  });

  if(!found && madnatorySpecialParams.length > 0){
    err = "Atleast one of these four Parameter required " + msgStr;
  }
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
    err = validateData(options,obj);
    if (err) {
      errObj.push({
        Error: err,
        rowCount: x.__rowNum__
      });
    } else {
        obj.user = options.user;

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
  var uploadedData = [];
  //numericCols : ['customerTransactionId','customerValuationNo','customerPartyNo','engineNo','chassisNo','registrationNo','contactPersonTelNo']
  var ENTERPRISE_FIELD = 'enterpriseId';
  var options = {
    fileName : fileName,
    user : user,
    partnerType : 'ENTERPRISE',
    uploadType : 'UPLOAD',
    numericCols : ['customerInvoiceValue'],
    dateParams : ['customerInvoiceDate','repoDate'],
    madnatoryParams : ['partnerId','purpose','requestType','assetCategory',"yardParked",'country','state','city','contactPerson','contactPersonTelNo','assetDescription'],
    madnatorySpecialParams : ['engineNo','chassisNo','registrationNo','serialNo']
  };
  
  if(user.role == 'admin')
    options.madnatoryParams.push(ENTERPRISE_FIELD);
  var parsedResult = parseExcel(options);
  var errObj = [];
  if(parsedResult.errObj && parsedResult.errObj.length)
    errObj = errObj.concat(parsedResult.errObj);
  var uploadData = parsedResult.uploadData;
  var totalCount = parsedResult.totalCount;

  if(totalCount > 99){
    var result = {
      errObj : [],
      msg : 'You can upload 99 record only at a time.'
    };
    return res.json(result);
  }

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
    async.parallel([validateEnterprise,validateRequestType,validatePurpose,validateYearOfManufacturing,validateAgency,validateMasterData,validateCountry],middleManProcessing);

    function validateEnterprise(callback){
      if(user.role== 'enterprise')
        row.enterpriseId = user.enterpriseId;
      UserModel.find({enterpriseId : row.enterpriseId,"enterprise" : true,status:true}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating enterprise');

        if(!result.length)
          return callback('Invalid enterprise');

        row.enterprise = {

          email : result[0].email,
          mobile : result[0].mobile,
          _id : result[0]._id + "",
          enterpriseId : result[0].enterpriseId,
          employeeCode : result[0].employeeCode,
          name : (result[0].fname || "") + " "+ (result[0].lname || "")
        };

        row.autoSubmit = false;
        
        if(result[0].availedServices && result[0].availedServices.length){
          result[0].availedServices.forEach(function(srvc){
            if(srvc.code === row.requestType &&  srvc.approvalRequired !== 'Yes')
              row.autoSubmit = true;
          });
        }

        return callback();
      });
    }

    function validateRequestType(callback){
      if(validRequestType.indexOf(row.requestType) < 0)
        return callback('Invalid Request Type');
        if(user.role == 'enterprise'){
          var found = false;
          for(var i=0 ; i < user.availedServices.length;i++){
            if(user.availedServices[i].code == row.requestType){
              found = true;
              break;
            }
          }
          if(!found)
            return callback('Invalid Request Type');
        }

      return callback();
    }

    function validateYearOfManufacturing(callback){
      if(!row.yearOfManufacturing)
        return callback();
      var currentYear = new Date().getFullYear();
      var isInvalid = isNaN(row.yearOfManufacturing);
      if(isInvalid || row.yearOfManufacturing.length != 4)
        return callback("Invalid manufacturing year.");
       var mfgYear = parseInt(row.yearOfManufacturing);
       if(mfgYear > 1900 && mfgYear <= currentYear)
        return callback();
       else
        return callback("Invalid manufacturing year.");

    }

    function validatePurpose(callback){
      if(row.purpose == DEFAULT_PURPOSE)
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
          _id : result[0]._id + "",
          partnerId : row.partnerId,
          name : result[0].entityName
        };

        return callback();
      })
    }

    function validateMasterData(callback){
        if(!row.brand){
          delete row.model;
          return callback();
        }
       commonFunc.fetchBrand({name:row.brand},function(err,brands){
          if(err || !brands)
            return callback('Error while validating brand');

          if(!brands.length){
              row.otherBrand = row.brand;
              row.brand = "Other";

              if(row.model){
                 row.otherModel = row.model;
                 row.model = "Other";
              }
             
              return callback();
          } 

          if(!row.model)
            return callback();

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
      row.customerPartyNo = user.mobile;
      row.userName = (user.fname || "") + " " + (user.mname || "") +(user.mname ? " " : "") + (user.lname || "");
      row.legalEntityName = (user.company || "");
      row.createdBy = {
        name : user.fname + " " + user.lname,
        _id : user._id,
        email : user.email,
        mobile : user.mobile,
        role : user.role
      };

      row.statuses = [{
        createdAt : new Date(),
        status : EnterpriseValuationStatuses[0],
        userId : user._id
      }]

      _getAssetGroupCategory(row.assetCategory,row.agency.partnerId,row.enterprise.enterpriseId,function(acErr,result){
           if(acErr) { 
                    errObj.push({
                      Error: 'Error while inserting data',
                      rowCount: row.rowCount
                    });
                  return cb();
             }
             if(result && result.data){
              row.valuerGroupId = result.data.valuerGroupId || "";
              row.valuerAssetId = result.data.valuerAssetId || "";
             }
             if(result && !result.found)
              _createAssetGroupCategory(row.createdBy,row.assetCategory,row.enterprise.enterpriseId,row.agency.partnerId);

          EnterpriseValuation.create(row, function(err, enterpriseData) {
          if(err || !enterpriseData) { 
            errObj.push({
              Error: 'Error while inserting data',
              rowCount: row.rowCount
            });
          }
          if(enterpriseData)
            pushNotification(enterpriseData);
          enterpriseData = enterpriseData.toObject();
          enterpriseData.autoSubmit = row.autoSubmit;
          if(!err && enterpriseData)
            uploadedData.push(enterpriseData);
          return cb();
        });
      })
    }
  }


  function finalize(err){
    debug(err);

    return res.json({
      uploadedData : uploadedData,
      msg : (totalCount - errObj.length) + ' out of ' + totalCount + ' uploaded sucessfully',
      errObj : errObj 
    });
  }
};

  function pushNotification(reqData){
   try{
        if(reqData.createdBy.email) {
          var emailData = {};
          var tplData = {};
          emailData.to = reqData.createdBy.email;
          var tmplName = VALUATION_REQUEST;
          emailData.notificationType = "email";
          if(reqData.status === EnterpriseValuationStatuses[0]) {
            emailData.subject = reqData.requestType + " " + 'Request Initiated with Unique Control No. - ' + reqData.uniqueControlNo;
            tplData.status = "initiated";
          }
          if(reqData.status === EnterpriseValuationStatuses[2]) {
            emailData.subject = reqData.requestType + " " + 'Request Approved for Unique Control No. - ' + reqData.uniqueControlNo;
            tplData.status = "submitted";
          }
          if(reqData.status === EnterpriseValuationStatuses[4]) {
            tmplName = VALUATION_REPORT_SUBMISSION;
            emailData.cc = reqData.enterprise.email;
            emailData.subject = 'Valuation Report as an attachment for Unique Control No. - ' + reqData.uniqueControlNo;
            //tplData.assetDir = reqData.assetDir;
            if(reqData.valuationReport && reqData.valuationReport.filename) {
              tplData.external = reqData.valuationReport.external;
              tplData.reportUrl = reqData.valuationReport.filename;
            }
          }
          tplData.uniqueControlNo = reqData.uniqueControlNo;
          tplData.name = reqData.createdBy.name;
          tplData.requestType = reqData.requestType;
          if(reqData.status === EnterpriseValuationStatuses[4]) {
            sendMail(tplData, emailData, tmplName);
          } else if(reqData.status === EnterpriseValuationStatuses[0] || reqData.status === EnterpriseValuationStatuses[2]){
            var approverUsers = [];
            var userFilter = {};
            userFilter.role = "enterprise";
            userFilter.enterpriseId = reqData.enterprise.enterpriseId;
            userFilter.status = true;
            UserModel.find(userFilter,function(err,results){
              if(results.length > 0){
                results.forEach(function(item){
                  for(var i=0;i<item.availedServices.length;i++){
                    if(item.availedServices[i].code === reqData.requestType && item.availedServices[i].approver === true && item.email !== reqData.createdBy.email) {
                      approverUsers[approverUsers.length] = item.email;
                    }
                  }
                });
                emailData.cc = approverUsers.join(',');
                sendMail(tplData, emailData, tmplName);
              }
            })
          }
        }
    }
    catch (ex) {
      console.log(ex);
    }
}

  function sendMail(tplData, emailData, tmplName) {
    commonController.compileTemplate(tplData, config.serverPath, tmplName, function(ret,retData){
      if(!ret){
          console.log(ret);
      }else{
          emailData.content =  retData;
          notification.pushNotification(emailData,function(pushed){
          console.log("Email send.");
        });
      }
    });
  }
  
exports.pushNotification = pushNotification;
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
    numericCols : ['customerInvoiceValue'],
    dateParams : ['customerInvoiceDate','repoDate'],
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

  if(totalCount > 99){
    var result = {
      errObj : [],
      msg : 'You can update 99 record only at a time.'
    };
    return res.json(result);
  }

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
      async.parallel([validateEnterprise,validateValuation,updateAssetGroupCategory,validateRequestType,validateYearOfManufacturing,validatePurpose,validateAgency,validateMasterData,validateCountry],middleManProcessing);  
    }

    function updateAssetGroupCategory(callback){
      if(!row.assetCategory)
        return callback();
       EnterpriseValuation.find({uniqueControlNo : row.uniqueControlNo},function(err,retData){
         if(err) { 
            return callback('Error while updateting asset group category data');
          }
          if(!retData || retData.length == 0)
            return callback();

          var prtId = row.partnerId || retData[0].agency.partnerId;
          var entId = row.enterpriseId || retData[0].enterprise.enterpriseId;

          _getAssetGroupCategory(row.assetCategory,prtId,entId,function(err,result){
               if(err) { 
                  return callback('Error while updateting asset group category data');
                }

               if(result && result.data){
                row.valuerGroupId = result.data.valuerGroupId || "";
                row.valuerAssetId = result.data.valuerAssetId || "";
               }

               if(result && !result.found)
                _createAssetGroupCategory(retData[0].createdBy,row.assetCategory,entId,prtId);
              return callback();
          })

       });

    }
    
    function validateEnterprise(callback){
      
      if(!row.enterpriseId)
        return callback();
      if(user.role== 'enterprise')
        row.enterpriseId = row.user.enterpriseId;

      UserModel.find({enterpriseId : row.enterpriseId,"enterprise" : true,status:true}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating enterprise');

        if(!result.length)
          return callback('Invalid enterprise');

        row.enterprise = {
          email : result[0].email,
          mobile : result[0].mobile,
          _id : result[0]._id + "",
          enterpriseId:result[0].enterpriseId,
          employeeCode : result[0].employeeCode,
          name : (result[0].fname || "") + " "+ (result[0].lname || "")
        };

        row.customerPartyName = row.enterprise.name;
        return callback();
      });
    }

    function validateValuation(callback){

      EnterpriseValuation.find({uniqueControlNo : row.uniqueControlNo}).exec(function(err,result){
        if(err || !result)
          return callback('Error while validating valuation request');

        if(!result.length)
          return callback('Invalid Valuation request');

        
        var enterpriseValidStatus = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[1]];
        var agencyValidStatus = [EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[3]];
        
        row.valData = result[0];
        if(updateType == 'agency'){
          if(!result[0].reportDate)
              row.reportDate = new Date();
          if(user.role == 'admin')
            return callback();
          if(user.isPartner && user.partnerInfo && user.partnerInfo._id == result[0].agency._id && agencyValidStatus.indexOf(result[0].status) != -1)
              return callback();
          else
            return callback('User does not have privilege to update record');
        }else{
          var isValidForUpdate = enterpriseValidStatus.indexOf(result[0].status) != -1;
          if(isValidForUpdate && user.role == 'admin')
            return callback();
          else if(isValidForUpdate && user.enterpriseId == result[0].enterprise.enterpriseId)
            return callback();
          else
             return callback('User does not have privilege to update record');
        }
      })
    }

     function validateYearOfManufacturing(callback){
      if(!row.yearOfManufacturing)
        return callback();
      var currentYear = new Date().getFullYear();
      var isInvalid = isNaN(row.yearOfManufacturing);
      if(isInvalid || row.yearOfManufacturing.length != 4)
        return callback("Invalid manufacturing year.");
       var mfgYear = parseInt(row.yearOfManufacturing);
       if(mfgYear > 1900 && mfgYear <= currentYear)
        return callback();
       else
        return callback("Invalid manufacturing year.");

    }

    function validateRequestType(callback){
      if(!row.requestType)
        return callback();        
      if(validRequestType.indexOf(row.requestType) < 0)
        return callback('Invalid Request Type');
       if(user.role == 'enterprise'){
          var found = false;
          for(var i = 0 ; i < user.availedServices.length; i++){
            if(user.availedServices[i].code == row.requestType){
              found = true;
              break;
            }
          }
          if(!found)
            return callback('Invalid Request Type');
        }

      return callback();
    }

    function validatePurpose(callback){
      if(!row.purpose || row.purpose == DEFAULT_PURPOSE)
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

      if(!row.partnerId)
        return callback();
      if(row.partnerId && !row.requestType)
          return callback('For agency update Request_Type is required.');

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
          _id : result[0]._id + "",
          partnerId : row.partnerId,
          name : result[0].entityName
        };

        return callback();
      })
    }

     function validateMasterData(callback){
      if(!row.brand){
          delete row.model;
          return callback();
      }
       commonFunc.fetchBrand({name:row.brand},function(err,brands){
          if(err || !brands)
            return callback('Error while validating brand');

          if(!brands.length){
              row.otherBrand = row.brand;
              row.brand = "Other";
              if(row.model){
                row.otherModel = row.model;
                row.model = "Other";
                
              }
              return callback();
          } 
          if(!row.model)
            return callback();

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
        row.reportSubmissionDate = new Date();
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
        if(err || !enterpriseData) { 
          errObj.push({
            Error: 'Error while updating data',
            rowCount: row.rowCount
          });
        }
        var entValFilter = {};
        entValFilter.uniqueControlNo = uniqueControlNo;
        EnterpriseValuation.find(entValFilter,function(err,results){
          if(err){
            console.log(err);
          }
          if(results && updateType == 'agency')
            pushNotification(results[0]);
        })
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
  
  var bodyData = req.body.data;
  var user = req.body.user;

  if(bodyData._id) { delete bodyData._id; }
  bodyData.updatedAt = new Date();
  EnterpriseValuation.findById(req.params.id, function (err, enterprise) {
    if (err) { return handleError(res, err); }
    if(!enterprise) { return res.status(404).send('Not Found'); }

    var enterpriseValidStatus = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[1]];
    var agencyValidStatus = [EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[3]];
    if(user.role == 'enterprise' && enterpriseValidStatus.indexOf(enterprise.status) != -1 && enterprise.enterprise.enterpriseId == user.enterpriseId)
      updateAssetGroupCategory(enterprise);
    else if(user.isPartner && user.partnerInfo && user.partnerInfo._id == enterprise.agency._id && agencyValidStatus.indexOf(enterprise.status) != -1)
      update();
    else if(user.role == 'admin')
      updateAssetGroupCategory(enterprise);
    else
      return res.status(401).send('User does not have privilege to update record');
  });
  
  function updateAssetGroupCategory(enterpriseData){

    if(!bodyData.assetCategory)
      return update();
    var isChanged = (bodyData.assetCategory != enterpriseData.assetCategory) || (bodyData.agency.partnerId != enterpriseData.agency.partnerId) || (bodyData.enterprise.enterpriseId != enterpriseData.enterprise.enterpriseId);
     if(!isChanged)
        return update();
     _getAssetGroupCategory(bodyData.assetCategory,bodyData.agency.partnerId,bodyData.enterprise.enterpriseId,function(err,result){
          if(err) { return update();}
         if(result && result.data){
            bodyData.valuerGroupId = result.data.valuerGroupId || "";
            bodyData.valuerAssetId = result.data.valuerAssetId || "";
          }
         if(result && !result.found)
            _createAssetGroupCategory(bodyData.createdBy,bodyData.assetCategory,bodyData.enterprise.enterpriseId,bodyData.agency.partnerId);
          return update();
      }); 
  }

  function update(){
    if(bodyData.status === EnterpriseValuationStatuses[4]){
      bodyData.reportDate = new Date()
      bodyData.reportSubmissionDate = new Date();
    }
     EnterpriseValuation.update({_id:req.params.id},{$set:bodyData},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Enterprise valuation updated sucessfully"});
    });
  }
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
      if(dt.assignSubmitDate)
        dt.submittedToAgencyDate = new Date();
      if(dt.generateInvoiceDate)
        dt.invoiceDate = new Date();

      delete dt.generateInvoiceDate;
      delete dt.assignSubmitDate;

      EnterpriseValuation.findById(_id,function(err,retRow){
        if(err){return callback(err)}
        if(!retRow)
          return callback("Enterprise valuations request is not found");
        if(retRow.jobId && dt.jobId)
            delete dt.jobId;
        EnterpriseValuation.update({_id:_id},{$set:dt},function(err){
          callback(err)
        });

      });
    }
}

//Invoice functions
exports.createInvoice = function(req,res){

  if(!req.body.uniqueControlNos || req.body.uniqueControlNos.length == 0)
    return res.status(400).send("Invalid Request");

  EnterpriseValuationInvoice.find({uniqueControlNos:{$elemMatch:{$in:req.body.uniqueControlNos}}},function(err,result){
    if(err) { return handleError(res, err); }
    if(result.length > 0)
      return res.status(409).send("Invoice is already generated for one or more transaction.");
    _create();    
  });

  function _create(){
    EnterpriseValuationInvoice.create(req.body, function(err, enterpriseData) {
        if(err) { return handleError(res, err); }
        return res.status(201).json(enterpriseData);

      });
  }
  

}

exports.generateInvoice = function(req,res){
  var invoiceNo = req.params.invoiceNo;
  if(!invoiceNo){
    return res.status(412).json({Err:'Invalid invoice Number'});
  }
    
  EnterpriseValuationInvoice.find({invoiceNo: invoiceNo},function(err,invoiceData){
    if(err || !invoiceData)
      return res.send(err || new APIError(400,'Error while fetching invoice'));
    
    if(invoiceData.length == 0)
      res.status(412).json({Err:'Invalid invoice Number'});

    fs.readFile(__dirname + '/../../views/emailTemplates/EValuation_Invoice.html', 'utf8', function(err, source) {
     if (err) {
        return handleError(res, err);
      }

      source = source.toString();
      //source += '</body></html>';
      var template = Handlebars.compile(source);

      var data = {
        invoiceData : invoiceData[0],
        invoiceDate : Utility.dateUtil.validateAndFormatDate(invoiceData[0].createdAt,'MM/DD/YYYY'),
        serverPath:config.serverPath
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

  var updateType = req.body.updateType;
  var _id = req.body._id;
  var chequeDetail = req.body.chequeDetail;
  var checkVal = chequeDetail.chequeValue + chequeDetail.deductedTds;
  var checkdetailObj = {
      bankName:"",
      branchName:"",
      chequeNo:"",
      chequeDate:"",
      chequeValue:"",
      deductedTds:"",
      attached:false
    };

  EnterpriseValuationInvoice.findById(_id, function (err, invoice) {
    if (err) { return handleError(res, err); }
    if(!invoice) { return res.status(404).send('Not Found'); }
    invoice.updatedAt = new Date();
    if(updateType == "paymentmade"){
      var remVal = invoice.paymentMadeDetail.remainingAmount - checkVal;
      if(remVal < 0)
        return res.status(412).send("Invalid update");

      var idx = getBlankChequeObj(invoice.paymentMadeDetail.paymentDetails);
      invoice.paymentMadeDetail.paymentDetails[idx] = chequeDetail;

      if(remVal == 0){
        invoice.paymentMadeDetail.remainingAmount = 0;
        invoice.paymentMade = true;
        invoice.paymentMadeDate = new Date();
      }else{
        invoice.paymentMadeDetail.remainingAmount = remVal;
        invoice.paymentMadeDetail.paymentDetails.push(checkdetailObj);
      }
      update(invoice);  
    }else if(updateType == "paymentreceived"){
        var remVal = invoice.paymentReceivedDetail.remainingAmount - checkVal;
        if(remVal < 0)
          return res.status(412).send("Invalid update");
        var idx = getBlankChequeObj(invoice.paymentReceivedDetail.paymentDetails);
        invoice.paymentReceivedDetail.paymentDetails[idx] = chequeDetail;
        if(remVal == 0){
          invoice.paymentReceivedDetail.remainingAmount = 0;
          invoice.paymentReceived = true;
          invoice.paymentReceivedDate = new Date();
        }else{
          invoice.paymentReceivedDetail.remainingAmount = remVal;
          invoice.paymentReceivedDetail.paymentDetails.push(checkdetailObj);
        }
        update(invoice);
      }else
        return res.status(412).send("Invalid update");
  });

  function update(invoice){
    EnterpriseValuationInvoice.update({_id:_id},{$set:invoice},function(err,retVal){
        if (err) { return handleError(res, err); }
        console.log("invoice",invoice);
        return res.status(200).json(invoice);
    });
  }

  function getBlankChequeObj(chequeArr){
    var idx = chequeArr.length;
    for(var i=0;i<chequeArr.length;i++){
      if(!chequeArr[i].attached){
          idx = i;
          break;

      }
    }
    return idx;
  }
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
  serialNo:{key:"agencySerialNo"},
  chasisNo:{key:"agencyChassisNo"},
  registrationNo:{key:"agencyRegistrationNo"},
  report_url:{key:"valuationReport",type:"file",required:true},
  general_image_url:{key:"generalImage",type:"file"},
  engine_image_url:{key:"engineImage",type:"file"},
  hydraulic_image_url:{key:"hydraulicImage",type:"file"},
  cabin_image_url:{key:"cabinImage",type:"file"},
  under_carriage_tyre_image_url:{key:"underCarriageImage",type:"file"},
  other_image_url:{key:"otherImage",type:"file"}
}

exports.updateFromAgency = function(req,res){
  
  var bodyData = req.body;

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

      updateObj.status = EnterpriseValuationStatuses[4];
      updateObj.statuses = valReq.statuses;
      updateObj.reportDate = new Date();
      updateObj.reportSubmissionDate = new Date();
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = "IQVL";
      stsObj.status = EnterpriseValuationStatuses[4];
      if(updateObj.statuses)
        updateObj.statuses[updateObj.statuses.length] = stsObj;

       //return sendResponse();
      EnterpriseValuation.update({_id:valReq._id},{$set:updateObj},function(err){
          if(err){
             result['success'] = false;
             result['msg'] = "System error at iQuippo";
          }
          pushNotification(valReq);
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

var Invoice_Properties = ["invoiceNo","requestType","enterprise","agency","totalAmount","createdAt"]
exports.exportExcel = function(req,res){
  var queryParam = req.query;
  var filter = {};
  if(queryParam.enterpriseId)
    filter['enterprise.enterpriseId'] = queryParam.enterpriseId;
  if(queryParam.agencyId)
    filter['agency._id'] = queryParam.agencyId;
  if (queryParam.userId)
    filter["createdBy._id"] = queryParam.userId;

  if(queryParam.ids){
    var ids = queryParam.ids.split(',');
    filter['_id'] = {$in:ids};
  }

  var dateFilter = {};
  if(queryParam.fromDate)
    dateFilter['$gte'] = new Date(queryParam.fromDate);
  if(queryParam.toDate) {
      var toDate = new Date(queryParam.toDate);
      var nextDay = toDate.getDate() + 1;
      toDate.setDate(nextDay);
      dateFilter.$lt = toDate;
    }
    //dateFilter['$lt']= new Date(queryParam.toDate);

  switch(queryParam.type){
    case "transaction":
     if(queryParam.fromDate || queryParam.toDate)
        filter['createdAt'] = dateFilter;

      var fieldMap = fieldsConfig["TRANSACTION_EXPORT"];
      var query = EnterpriseValuation.find(filter).sort({createdAt:-1});
      query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          exportExcel(req,res,fieldMap,dataArr);
      })
      break;
    case 'invoice':

      if(queryParam.fromDate || queryParam.toDate)
        filter['createdAt'] = dateFilter;
      var fieldMap = fieldsConfig["INVOICE_EXPORT"];
      var query = EnterpriseValuationInvoice.find(filter).sort({createdAt:-1});
       query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          var flatArr = _getformatedInvoice(dataArr);
          exportExcel(req,res,fieldMap,flatArr);
      })
       break;
    case 'paymentmade':
       var fieldMap = fieldsConfig["EXPORT_PAYMENT"];
       filter['paymentMade'] = true;
      if(queryParam.fromDate || queryParam.toDate)
        filter['paymentMadeDate'] = dateFilter;
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
          exportExcel(req,res,fieldMap,jsonArr);
      })
      break;
    case "paymentreceived":
      var fieldMap = fieldsConfig["EXPORT_PAYMENT"];
      filter['paymentReceived'] = true;
      if(queryParam.fromDate || queryParam.toDate)
        filter['paymentReceivedDate'] = dateFilter;
      
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
  }

  function _getformatedInvoice(dataArr){
    
    var retArr = [];
    dataArr.forEach(function(mainItem,idx){
      mainItem.paymentReceivedDetail.paymentDetails.forEach(function(item){
        var obj = _getInvoiceObj(mainItem);
        obj.paymentType = "Payment Made";
        _.forEach(item,function(value,key){
             obj[key] = value || "";
        })
        retArr.push(obj);
      });
      mainItem.paymentReceivedDetail.paymentDetails.forEach(function(item){
        var obj = _getInvoiceObj(mainItem);
        obj.paymentType = "Payment Received";
        _.forEach(item,function(value,key){
             obj[key] = value || "";
        })
        retArr.push(obj);
      });

    });

    function _getInvoiceObj(mainItem){
      var obj = {};
      Invoice_Properties.forEach(function(key){
        obj[key] = mainItem[key] || "";
      })
      obj["paymentMade"] = (mainItem.totalAmount - (mainItem.paymentMadeDetail.remainingAmount || 0)) || 0; 
      obj["paymentReceived"] = (mainItem.totalAmount - (mainItem.paymentReceivedDetail.remainingAmount || 0)) || 0;
      return obj;
    }

    return retArr;
  }

  function _formatPayments(item,innerItem,jsonArr){
    var obj = {};
    obj['invoiceNo'] = item.invoiceNo || "";
    obj['requestType'] = item.requestType || "";
    obj['enterpriseId'] = item.enterprise.enterpriseId || "";
    obj['enterpriseName'] = item.enterprise.name || "";
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
  console.log( req.protocol + "://"+ req.headers.host );
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
      if(keyObj.key == 'status' && item.deleted)
          item.status = "Deleted";
      var val = _.get(item,keyObj.key,"");
      if(keyObj.type && keyObj.type == 'boolean')
          val = val?'YES':'NO';
      if(keyObj.type && keyObj.type == 'date' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
      if(keyObj.type && keyObj.type == 'url' && val){
        if(val.filename){
          if(val.external === true)
          val = val.filename;
          else
            val =  req.protocol + "://" + req.headers.host + "/download/"+ item.assetDir + "/" + val.filename || "";
        }else
          val = "";
        
      }

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