'use strict';

var _ = require('lodash');
var Seq = require("seq");
var writtenFrom = require('written-number');
var request = require('request');
var EnterpriseValuation = require('./enterprisevaluation.model');
var EnterpriseValuationInvoice = require('./enterprisevaluationinvoice.model');
var Product = require('../product/product.model');
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
var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Inspection In Progress','Inspection In Completed','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner','Completed'];
//var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
var updatableFields = ['customerTransactionId','assetDescription','engineNo','chassisNo','registrationNo','serialNo','yearOfManufacturing','yardParked','country','state','city','contactPerson','contactPersonTelNo','nameOfCustomerSeeking','rcDoc','invoiceDoc'];
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
   if (queryParam.statusType){
    if(queryParam.statusType === 'Request Cancelled')
      filter['cancelled'] = true;
    else if(queryParam.statusType === 'Request Modified')
       filter['requestModified'] = true;
     else if(queryParam.statusType === 'Request On Hold')
      filter['onHold'] = true;
      else if(queryParam.statusType === 'Payment Received'){
        filter['paymentReceived'] = true;
        filter["status"] = EnterpriseValuationStatuses[7]; 
      }
    else if(queryParam.statusType === 'Payment Made'){
      filter['paymentMade'] = true;
      filter["status"] = EnterpriseValuationStatuses[7];
    }
    else{
      filter["status"] = queryParam.statusType;
      filter['cancelled'] = false;
      filter['requestModified'] = false;
      filter['onHold'] = false;
      if(queryParam.statusType !== EnterpriseValuationStatuses[10]){
         filter['paymentReceived'] = false;
         filter['paymentMade'] = false;
      }
     
    }    
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

    var mandatoryParams =  ['agency.partnerId','enterprise.enterpriseId','purpose','requestType','assetCategory',"yardParked",'country','state','city','contactPerson','contactPersonTelNo','assetDescription'];
    var vehicleParamsArr = ['registrationNo','chassisNo'];

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
    delete bodyData.requestDate;
    EnterpriseValuation.create(bodyData, function(err, enterpriseData) {
      if(err){
        return handleError(res, err);
      }
      return res.status(201).json(enterpriseData);
    });

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
    err = "Atleast one of these two Parameter required " + msgStr;
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
    madnatorySpecialParams : ['chassisNo','registrationNo']
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
    async.parallel([validateEnterprise,validateRequestType,validatePurpose,validateAssetGroupCategory,validateYearOfManufacturing,validateAgency,validateMasterData,validateCountry],middleManProcessing);

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

    function validateAssetGroupCategory(callback){
      var filter = {deleted:false};
      try{
        filter.assetCategory = {$regex: new RegExp( "^"+ row.assetCategory + "$", 'i')};
      }catch(err){
        filter.assetCategory = row.assetCategory;
      }
      filter.enterpriseId = row.enterpriseId;
      filter.valuerCode = row.partnerId;
      AssetGroupModel.find(filter,function(err,eqRes){
        if(err){return callback("Error in asset category validation");}
        if(!eqRes.length){return callback("Incorrect asset category is selected.");}
        if(eqRes.length){
           row.valuerGroupId = eqRes[0].valuerGroupId || "";
           row.valuerAssetId = eqRes[0].valuerAssetId || "";
           row.assetCategory = eqRes[0].assetCategory;
        }
        return callback();
      });
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
        role : user.role,
        userCustomerId: user.customerId
      };

      row.statuses = [{
        createdAt : new Date(),
        status : EnterpriseValuationStatuses[0],
        userId : user._id,
        name : user.fname + " " + user.lname,
        email : user.email,
        mobile : user.mobile
      }];

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
          if(reqData.status === EnterpriseValuationStatuses[6]) {
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
          if(reqData.status === EnterpriseValuationStatuses[6]) {
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
  var successArr = [];

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
            return callback('Error while updating asset group category data');
          }
          if(!retData || retData.length == 0)
            return callback();

          var prtId = row.partnerId || retData[0].agency.partnerId;
          var entId = row.enterpriseId || retData[0].enterprise.enterpriseId;
          var filter = {deleted:false};
          filter.enterpriseId = entId;
          filter.valuerCode = prtId;
          try{
            filter.assetCategory = {$regex: new RegExp( "^"+ row.assetCategory + "$", 'i')};
          }catch(err){
            filter.assetCategory = row.assetCategory;
          }

          AssetGroupModel.find(filter,function(err,eqRes){
            if(err){return callback("Error in asset category validation");}
            if(!eqRes.length){return callback("Incorrect asset category is selected.");}
            if(eqRes.length){
               row.valuerGroupId = eqRes[0].valuerGroupId || "";
               row.valuerAssetId = eqRes[0].valuerAssetId || "";
               row.assetCategory = eqRes[0].assetCategory;
            }
            return callback();
          });
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

        
        var enterpriseValidStatus = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[1],EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[6]];
        var agencyValidStatus = [EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[5]];
        
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
        row.status = EnterpriseValuationStatuses[6];
        row.statuses = valReq.statuses;
        row.statuses.push({
            createdAt : new Date(),
            status : EnterpriseValuationStatuses[6],
            userId : user._id,
            name:user.fname + " " + user.lname,
            email:user.email,
            mobile:user.mobile
        });

        if(row.reportUrl){
          row['valuationReport'] = {
            external:true,
            filename:row.reportUrl
          }
        }
      }else{
        var updatedFields = [];
        updatableFields.forEach(function(field){
          if(row[field]&& row.valData && row[field] !== row.valData[field])
            updatedFields.push(field);
        });
        if(updatedFields.length)
          row.fieldsModified = updatedFields.join(',');
        else
          row.fieldsModified = "";
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
          if(results && results.length && updateType == 'agency')
            pushNotification(results[0]);
          if(results && results.length){
            successArr[successArr.length] = results[0];
          }
          return cb();
        })
      });
    }
  }


  function finalize(err){
    debug(err);
    return res.json({
      msg : (totalCount - errObj.length) + ' out of ' + totalCount + ' updated sucessfully',
      errObj : errObj,
      successArr:successArr

    });
  }
};


// Updates an existing enterprise valuation in the DB.
exports.update = function(req, res) {
  // console.log(req.body);
  var bodyData = req.body.data;
  var user = req.body.user;
  if(bodyData._id) { delete bodyData._id; }
  bodyData.updatedAt = new Date();
  bodyData.auditLogs = [req.enterprise];
  EnterpriseValuation.update({_id:req.params.id},{$set:bodyData},function(err){
      if (err) { return handleError(res, err); }
      if(bodyData.status == "Valuation Report Submitted" && (bodyData.assessedValue || bodyData.overallGeneralCondition)) {
        var data = {
            valuationAssessedValue: bodyData.assessedValue,
            valuationOverallGeneralCondition: bodyData.overallGeneralCondition
        };
        Product.update({assetId: bodyData.assetId}, data , function (err, res) {
            if (err) {
                console.error(err);
            } 
        });        
      }
      return res.status(200).send("Enterprise valuation updated sucessfully");
  });

};

exports.validateUpdate = function(req,res,next){
  
  var user = req.body.user;
  var bodyData = req.body.data;
  var updateType = req.body.updateType;
  var enterpriseValidStatus = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[1],EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[6]];
  var agencyValidStatus = [EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[4],EnterpriseValuationStatuses[5],EnterpriseValuationStatuses[6]];
  EnterpriseValuation.findById(req.params.id,function(err,enterprise){
    if (err) { return handleError(res, err); }
    if(!enterprise) { return res.status(404).send('Not Found'); }
    req.enterprise = enterprise;
    if(updateType === 'agency'){
      if(user.role == 'admin' || (user.isPartner && user.partnerInfo && user.partnerInfo._id == enterprise.agency._id && agencyValidStatus.indexOf(enterprise.status) != -1)){
        if(bodyData.status === EnterpriseValuationStatuses[6]){
          bodyData.reportDate = new Date();
          bodyData.reportSubmissionDate = new Date();
        }
        return next();
      }else
        return res.status(401).send('User does not have privilege to update record');  
    }else if(updateType === 'enterprise'){
      var updatedFields = [];
      updatableFields.forEach(function(field){
        if(req.body.data[field] && req.body.data[field] !== enterprise[field])
          updatedFields.push(field);
      });
      if(updatedFields.length)
        req.body.data.fieldsModified = updatedFields.join(',');
      else
        req.body.data.fieldsModified = "";

      if(user.role === 'admin' || (user.role == 'enterprise' && enterpriseValidStatus.indexOf(enterprise.status) != -1 && enterprise.enterprise.enterpriseId == user.enterpriseId))
        return next();
      else
        return res.status(401).send('User does not have privilege to update record !!!'); 

    }else
      return res.status(400).send('Invalid update request !!!');

  });
}

exports.submitRequest = function(req,res){

  var ids = req.body;
  var type = req.query.type;
  if(['Mjobcreation','Mjobupdation'].indexOf(type) === -1)
    return res.status(400).send("Invalid type parameter");
  if(!ids.length)
    return res.status(400).send("Invalid request");
  var fieldMap = fieldsConfig.SUBMITTED_TO_AGENCY_FIELD;
  EnterpriseValuation.find({_id:{$in:ids},deleted:false},function(err,valReqs){
    if(err) return handleError(res, err);
    if(!valReqs.length){
      return res.status(200).send("No record found to submit");
    }
      postRequest(valReqs);
  });

  function postRequest(valReqs){
    var dataArr = [];
    var keys = Object.keys(fieldMap);
    valReqs.forEach(function(item){
      if(type === 'Mjobcreation' && item.jobId)
        return;
      if(type === 'Mjobupdation' && !item.jobId)
        return;
      if(item.cancelled)
        return;
      var obj = {};
      keys.forEach(function(key){
        obj[key] = _.get(item,fieldMap[key],"");
      })

      if(obj.brand && obj.brand == "Other")
        obj.brand = item.otherBrand;

      if(obj.model && obj.model == "Other")
        obj.model = item.otherModel;

      if(type === 'Mjobupdation' && item.jobId)
        obj.jobId = item.jobId;

      var s3Path = "";
      if(item.assetDir)
        s3Path = config.awsUrl + config.awsBucket + config.awsBucketPrefix + item.assetDir + "/";
      if(s3Path && item.invoiceDoc&& item.invoiceDoc.filename)
          obj.invoiceDoc = s3Path + item.invoiceDoc.filename;
      if(s3Path && item.rcDoc && item.rcDoc.filename)
      obj.rcDoc = s3Path + item.rcDoc.filename;
      dataArr[dataArr.length] = obj;
    });
    if(!dataArr.length)
      return res.status(200).send("There is no request to post.");
    request({
        url: config.qpvalURL + "?type=" + type,
        method: "POST",
        json: true, 
        body: dataArr
    }, function (error, response, body){
      if(error)
         return res.status(412).send("Unable to post request to agency.Please contact support team.");
      if(response.statusCode == 200){
          requestPostProcessing(valReqs,response.body);
      }else{
        return res.status(412).send("Unable to post request to agency.Please contact support team");
      }

    });
  }

  function requestPostProcessing(valReqs,resList){
    
    valReqs.forEach(function(valReq){
      var resItem = getResOnUniqueControlNo(valReq.uniqueControlNo,resList);
      if(!resItem){
        valReq.resubmit = true;
        return;
      }

      if(type === 'Mjobcreation'){
        if(resItem.success == "true"){
          valReq.jobId = resItem.jobId;
          valReq.submittedToAgencyDate = new Date();
          valReq.remarks = "";
          valReq.resubmit = false;
          setStatus(valReq,EnterpriseValuationStatuses[2]);
        }else{
          valReq.remarks = resItem.msg || "Unable to submit";
          valReq.resubmit = true;
          setStatus(valReq,EnterpriseValuationStatuses[1]);
        }

        return;
      }

      if(type === 'Mjobupdation'){
        if(resItem.success == "true"){
            valReq.remarks = "";
           if(valReq.status === EnterpriseValuationStatuses[6]){
            valReq.requestModified = true;
            valReq.resubmit = false;
            valReq.requestModifiedDate = new Date();
            setStatus(valReq,"Request Modified",true);
           }else
              setStatus(valReq,EnterpriseValuationStatuses[2]);
        }else{
          valReq.remarks = resItem.msg || "Unable to submit";
          valReq.resubmit = true;
        }

      }

    });
    async.eachLimit(valReqs,5,update,function(err){
      if(err)
        return handleError(res,err);
      return res.status(200).send("Valuation request submitted successfully !!!");
    })
  }

  function update(valReq,cb){
    var _id = valReq._id;
    delete valReq._id;
    EnterpriseValuation.update({_id:_id},{$set:valReq},function(err,retVal){
      if(!err && type === 'Mjobcreation')
        pushNotification(valReq);
      return cb(err);
    }); 
  }

  function getResOnUniqueControlNo(unCtrlNo,resList){
    var retVal = null;
      if(!resList || !resList.length)
        return retVal;
      resList.some(function(item){
        if(item && item.uniqueControlNo == unCtrlNo){
          retVal = item
          return false;
        }
      });
      return retVal;
  }

   function setStatus(entValuation,status,doNotChangeStatus){
      if(!doNotChangeStatus)
        entValuation.status = status;
      var stObj = {};
      stObj.status = status;
      stObj.createdAt = new Date();
      stObj.userId = req.user._id;
      stObj.name = req.user.fname + " " + req.user.lname;
      stObj.mobile = req.user.mobile;
      stObj.email = req.user.email;
      if(!entValuation.statuses)
        entValuation.statuses = [];
      entValuation.statuses.push(stObj);
    }

}

exports.resumeRequest = function(req,res){
  
  var bodyData = req.body;
  if(!bodyData._id)
    return res.status(400).send("Invalid resume request request !!!");

  EnterpriseValuation.findById(bodyData._id,function(err,entReq){
    if(err) return handleError(res, err);
    if(!entReq)
      return res.status(404).send("Valuation request not found !!!");
    if(!entReq.onHold)
      return res.status(401).send("Request is not on hold !!!");
    if(req.user.role == 'admin')
      return resumeRequestAtQVAPL();
    if(entReq.enterprise.enterpriseId === req.user.enterpriseId)
      resumeRequestAtQVAPL();
    else
      return res.status(401).send("Invalid resume request !!!");
  });

  function resumeRequestAtQVAPL(){
    if(!bodyData.jobId)
      return res.status(401).send("Invalid resume request !!!");
    var FIELD_MAP = fieldsConfig.SUBMITTED_TO_AGENCY_FIELD;
    var servObj = {};
    var keys = Object.keys(FIELD_MAP);
    keys.forEach(function(key){
      servObj[key] = _.get(bodyData,FIELD_MAP[key],"");
    });
    var s3Path = "";
    if(bodyData.assetDir)
      s3Path = config.awsUrl + config.awsBucket + "/" + bodyData.assetDir + "/";
    if(s3Path && bodyData.invoiceDoc&& bodyData.invoiceDoc.filename)
        servObj.invoiceDoc = s3Path + bodyData.invoiceDoc.filename;
    if(s3Path && bodyData.rcDoc && bodyData.rcDoc.filename)
        servObj.rcDoc = s3Path + bodyData.rcDoc.filename;
    if(bodyData.userComment)
        servObj.comment = bodyData.userComment;
      servObj.jobId = bodyData.jobId;
      request({
          url: config.qpvalURL + "?type=jobResume",
          method: "POST",
          json: true, 
          body: [servObj]
      }, function (error, response, body){
        if(error)
          return res.status(412).send("Unable to resume request.Please contact support team");  
        if(response.statusCode == 200 && response.body.length && response.body[0] && response.body[0].success === 'true'){
            bodyData.onHold = false;
            update();
        }else{
          return res.status(412).send("Unable to resume request.Please contact support team");
        }

    });
  }

  function update(){
    var _id = bodyData._id;
    delete bodyData._id;
    bodyData.resumeDate = new Date();
    bodyData.resumedBy = {
      userId:req.user._id,
      name:req.user.fname || "" + " " + req.user.lname || "",
      email:req.user.email,
      mobile:req.user.mobile,
      createdAt : new Date() 
    }
    EnterpriseValuation.update({_id:_id},{$set:bodyData},function(err,retVal){
      if(err) return handleError(res, err);
      return res.status(200).send("Valuation request resumed successfully !!!");
    }); 
  }
}

exports.cancelRequest = function(req,res){
  
  var bodyData = req.body;
  if(!bodyData._id)
    return res.status(400).send("Invalid cancel request !!!");
  if(req.user.role == 'admin')
    return cancelRequestAtQVAPL();

  EnterpriseValuation.findById(bodyData._id,function(err,entReq){
    if(err) return handleError(res, err);
    if(!entReq)
      return res.status(404).send("Valuation request not found !!!");
    if(entReq.enterprise.enterpriseId === req.user.enterpriseId)
      cancelRequestAtQVAPL();
    else
      return res.status(401).send("Invalid cancel request !!!");
  });

  function cancelRequestAtQVAPL(){
    if(!bodyData.jobId || bodyData.cancelled)
      return update();

    var serverData = {};
    serverData.uniqueControlNo = bodyData.uniqueControlNo;
    serverData.jobId = bodyData.jobId;
    serverData.cancellationFee = bodyData.cancellationFee || 0; 
    request({
        url: config.qpvalURL + "?type=cancel",
        method: "POST",
        json: true, 
        body: [serverData]
    }, function (error, response, body){
      if(error)
        return res.status(412).send("Unable to cancel request.Please contact support team");  
      if(response.statusCode == 200 && response.body.length && response.body[0] && response.body[0].success === 'true'){
          update();
      }else{
        return res.status(412).send("Unable to cancel request.Please contact support team");
      }

    });
  }

  function update(){
    var updateData = {};
    updateData.cancelled = true;
    updateData.cancellationFee = bodyData.cancellationFee || 0; 
    updateData.cancelledBy = {
      userId:req.user._id,
      name:req.user.fname || "" + " " + req.user.lname || "",
      email:req.user.email,
      mobile:req.user.mobile,
      createdAt : new Date() 
    }
    EnterpriseValuation.update({_id:bodyData._id},{$set:updateData},function(err,retVal){
      if(err) return handleError(res, err);
      return res.status(200).send("Valuation request cancelled successfully !!!");
    }); 
  }

}

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

  try{
    var getInvoiceDetail =  async.seq(getInvoice,getTransactions);
    getInvoiceDetail(function(err,result){
      if(err) return res.send(err);
      generateInvoice(req,res);
    });
  }catch(e){
    return handleError(res, err);
  };

  function getInvoice(callback){
    var invoiceNo = req.params.invoiceNo;   
    EnterpriseValuationInvoice.find({invoiceNo: invoiceNo},function(err,invoiceData){
      if(err || !invoiceData)
        return callback(err || new APIError(400,'Error while fetching invoice'));
      if(invoiceData.length == 0)
          return callback(new APIError(404,'Invoice detail not found'));
      req.invoiceData = invoiceData[0];
      return callback(null,req.invoiceData);
    });
  }

  function getTransactions(invoiceData,callback){
    var ucns = invoiceData.uniqueControlNos || [];
    EnterpriseValuation.find({uniqueControlNo:{$in:ucns}},function(err,valReqs){
      if(err || !valReqs)
        return callback(err || new APIError(400,'Error while fetching valuation requests'));
       if(valReqs.length == 0)
          return callback(new APIError(404,'Valuation requests not found'));
      req.valReqs = valReqs;
      callback(null,valReqs);
    });
  }
}

function generateInvoice(req,res){
    var invoiceData =  req.invoiceData;
    fs.readFile(__dirname + '/../../views/emailTemplates/EValuation_Invoice.html', 'utf8', function(err, source) {
     if (err) {
        return handleError(res, err);
      }

      source = source.toString();
      //source += '</body></html>';
      var template = Handlebars.compile(source);

      var descriptionD = invoiceData.requestType + " of";
      if(invoiceData.requestCount == 1){
        descriptionD += " " + invoiceData.assetCategory;
      }else
        descriptionD += " various assets as per annexure."
      var invoiceInWords = "";
      invoiceInWords = writtenFrom(invoiceData.totalAmount,{lang:'enIndian'});
      if(invoiceInWords)
        invoiceInWords += " only."
      if(invoiceInWords && invoiceInWords.length > 4){
        invoiceInWords = invoiceInWords.charAt(0).toUpperCase() + invoiceInWords.slice(1)
      }

      var data = {
        valReqs : req.valReqs,
        descriptionD:descriptionD,
        invoiceInWords:invoiceInWords,
        descriptionHd: invoiceData.requestType + " fee towards",
        invoiceData : invoiceData,
        invoiceDate : Utility.dateUtil.validateAndFormatDate(invoiceData.invoiceDate,'DD-MM-YYYY'),
        serverPath:config.serverPath,
        awsBaseImagePath:config.awsUrl + '/' + config.awsBucket
      };

       var taxColms = ['CGST','SGST','IGST'];
      if(invoiceData.selectedTaxes && invoiceData.selectedTaxes.length){
        invoiceData.selectedTaxes.forEach(function(tax){
          if(taxColms.indexOf(tax.type) !== -1)
            data[tax.type] = tax;
        });
      }

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
          console.log('err',err);
          res.send(new APIError(400,'Error while creating invoice'));
        }
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

exports.updateFromAgency = function(req,res){
  var validActions = ['reportupload','putonhold','statusupdate'];  
  var bodyData = req.body;
  var action = req.query.action;
  var result = {};
  result['success'] = true;
  result['jobID'] = bodyData.jobID;
  result['unique_controll_no']= bodyData.unique_controll_no;

  if(validActions.indexOf(action) === -1){
    result['success'] = false;
    result['msg'] = "Invalid action";
    return sendResponse();
  }

   var generalCond = req.body.overallGeneralCondition;
  if(generalCond){
   var bufferObj = new Buffer(generalCond, 'base64');
   req.body.overallGeneralCondition = bufferObj.toString('utf8');
  }
  var parameters = null;
  if(action == 'putonhold')
    parameters = fieldsConfig.PUT_ON_HOLD;
  else if(action == 'statusupdate')
    parameters = fieldsConfig.STATUS_UPDATE;
  else
    parameters = fieldsConfig.REPORT_UPLOAD;

  var msg = validateRequest(bodyData);
  if(msg){
    result['msg'] = msg;
    result['success'] = false;
    return sendResponse();
  }

  if(action === 'statusupdate'){
    bodyData.status = Utility.convertQVAPLStatus(bodyData.status);
    if(!bodyData.status){
      result['success'] = false;
      result['msg'] = "Invalid status";
      return sendResponse();
    }
  }

  checkRecordInDB(bodyData.unique_controll_no,function(msg,valReq){
    if(msg){
       result['msg'] = msg;
       result['success'] = false;
       return sendResponse();
    }else
        update(valReq);      

  });

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
         if(val)
          updateObj[parameters[key].key] = val;
      });

      if(action === 'putonhold'){
        updateObj.onHold = true;
        updateObj.onHoldDate = new Date();
      }else if(action === 'statusupdate'){
        if([EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[4]].indexOf(updateObj.status) === -1){
          result['msg'] = "Invalid status update";
          result['success'] = false;
          return sendResponse();
       }
        updateObj.statuses = valReq.statuses;
       var stsObj = {};       stsObj.createdAt = new Date();
       stsObj.userId = "IQVL";
       stsObj.status = updateObj.status;
       if(updateObj.statuses)
          updateObj.statuses[updateObj.statuses.length] = stsObj;
       }
      else{
        updateObj.status = EnterpriseValuationStatuses[6];
        updateObj.statuses = valReq.statuses;
        updateObj.reportDate = new Date();
        updateObj.reportSubmissionDate = new Date();
        updateObj.requestModified = false;
        var stsObj = {};
        stsObj.createdAt = new Date();
        stsObj.userId = "IQVL";
        stsObj.status = EnterpriseValuationStatuses[6];
        if(updateObj.statuses)
          updateObj.statuses[updateObj.statuses.length] = stsObj;
      }

      EnterpriseValuation.update({_id:valReq._id},{$set:updateObj},function(err){
          if(err){
             result['success'] = false;
             result['msg'] = "System error at iQuippo";
          } else {
              // updating value of fields in product db
              var data = {
                  valuationAssessedValue: updateObj.assessedValue,
                  valuationOverallGeneralCondition: updateObj.overallGeneralCondition
              };
              Product.update({assetId: valReq.assetId}, {$set:data} , function (err, res) {
                  if (err) {
                      console.error(err);
                  }
              });            
          }
          if(action === 'reportupload')
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
    dateFilter['$gte'] = new Date(decodeURIComponent(queryParam.fromDate));
  if(queryParam.toDate) {
      var toDate = new Date(decodeURIComponent(queryParam.toDate));
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
  var str = allowedHeaders.join(",");
  str += "\r\n";
  //dataArr.push(allowedHeaders);
  jsonArr.forEach(function(item,idx){
    //dataArr[idx + 1] = [];
    if(item.deleted)
        item.status = "Deleted";
    else if(item.cancelled)
      item.status = "Request Cancelled";
    else if(item.onHold)
      item.status = "Hold - " + item.onHoldMsg;
    else if(item.requestModified)
      item.status = "Request Modified";
    else if(item.paymentReceived && !item.paymentMade)
        item.status = "Payment Received";
    else if(item.paymentMade && !item.paymentReceived)
        item.status = "Payment Made";

    allowedHeaders.forEach(function(header){
      var keyObj = fieldMap[header];
      var val = _.get(item,keyObj.key,"");
      if(keyObj.type && keyObj.type == 'boolean')
          val = val?'YES':'NO';
      if(keyObj.type && keyObj.type == 'date' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
      if(keyObj.type && keyObj.type == 'datetime' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY HH:mm');
      if(keyObj.type && keyObj.type == 'url' && val){
        if(val.filename){
          if(val.external === true)
          val = val.filename;
          else
            val =  req.protocol + "://" + req.headers.host + "/download/"+ item.assetDir + "/" + val.filename || "";
        }else
          val = "";
        
      }
      val = Utility.toCsvValue(val);
        str += val + ",";
       //dataArr[idx + 1].push(val);
    });
    str += "\r\n";
  });

  str = str.substring(0,str.length -1);
  return  renderCsv(req,res,str);
  /*var ws = Utility.excel_from_data(dataArr,allowedHeaders);
  var ws_name = "entvaluation_" + new Date().getTime();

  var wb = Utility.getWorkbook();
  wb.SheetNames.push(ws_name);
  wb.Sheets[ws_name] = ws;
  var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
  res.end(wbout);*/
}

function renderCsv(req,res,csv){
  if(req.query.type == "transaction") {
    // change name of file in case of transaction
    req.query.type = "Ent_Valuation";
  }
  var fileName = req.query.type + "_" + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary'); 
}

function handleError(res, err) {
  return res.status(500).send(err);
}