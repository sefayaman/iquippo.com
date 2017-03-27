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
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD',moment.ISO_8601];
var fieldsConfig = require('./fieldsConfig');
var purposeModel = require('../common/valuationpurpose.model');
var EnterpriseValuationStatuses = ['Request Initiated','Request Submitted','Request Failed','Valuation Report Submitted','Valuation Report Failed','Invoice Generated','Payment Received','Payment Made to valuation Partner'];
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
  if (queryParam.partnerId)
    filter["agency.partnerId"] = queryParam.partnerId;
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
      return res.status(412).json({Err:'Missing madnatory parameter' + x });
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
  var enterpriseRoles = ['admin','enterprise'];
  if(enterpriseRoles.indexOf(user.role) < 0){
    options.partnerType = 'VALUATION_PARTNER';
    options.numericCols = [];
    options.dateParams = ['reportDate'];
    options.madnatoryParams = ['uniqueControlNo'];
  }
  
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
    * Process for bulk Upload(Enterprise and Admin users):
    * verify Request_Type,Purpose,Agency_Name
    * verfiy category brand and model 
    * verfiy country,state,location
    * if every thing is fine then upload data
    * validateCategory is for validating category,brand,model
    * validateCountry is for validating country,state,city
    */

    if(enterpriseRoles.indexOf(user.role) < 0){
      async.parallel([validateValuation],middleManProcessing)
    }else{
      async.parallel([validateEnterprise,validateValuation,validateRequestType,validatePurpose,validateAgency,validateCategory,validateCountry],middleManProcessing);  
    }

    
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
          return callback('User does not have privilege to update record');

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

/*//update on invoce number
exports.updateOnInvoice = function(req, res) {
  if(req.body.invoiceNo) { delete req.body.invoiceNo; }
  req.body.updatedAt = new Date();
    EnterpriseValuation.update({_id:req.params.id},{$set:req.body}{multi:true},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Enterprise valuation updated sucessfully"});
    });
};*/

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
          res.setHeader('Content-disposition', 'inline; filename=invoice.pdf"' + '"');
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
  jobID:"jobId",
  unique_controll_no:"uniqueControlNo",
  reportNo:"reportNo",
  assetNo:"assetNo",
  imeiNo:"gpsIMEINo",
  hmr_Kmr:"hmr_kmr",
  assessed_Value:"assessedValue",
  inspection_By:"inspectionBy",
  physical_Condition:"physicalCondition",
  gps_Installed:"gpsInstalled",
  gps_Device_No:"gpsDeviceNo"
}

 /* reportDate:"reportDate",
  reportNo:"reportNo",
  agencyYearOfManufacturing:"agencyYearOfManufacturing",
  agencyEngineNo:"agencyEngineNo",
  agencyChasisNo:"agencyChasisNo",
  agencyRegistrationNo:"agencyRegistrationNo",
  agencySerialNo:"agencySerialNo",
  hmr_kmr:"hmr_kmr",
  assessedValue:"assessedValue",
  inspectionBy:"inspectionBy",
  physicalCondition:"physicalCondition",
  gpsInstalled:"gpsInstalled",
  gpsDeviceNo:"gpsDeviceNo",
  gpsIMEINo:"gpsIMEINo",*/

exports.updateFromAgency = function(req,res){
  
  var bodyData = req.body;
  console.log("request body  data",bodyData);
  if(bodyData.length == 0){
    return res.status(200).send("No Data submitted");
  }
  var retList = validateRequest(bodyData);
  var keys = Object.keys(parameters);

  try{
    async.eachLimit(bodyData,5,update,onComplete);  
  }catch(e){
    res.status(500).send(e);
  }
  
  function update(dt,callback){
    getEnterpriseVal(dt.unique_controll_no,function(err,valArr){
          
          var obj = {};
          obj['jobID'] = dt.jobID;
          obj['unique_controll_no']= dt.unique_controll_no;
          obj['success'] = false;
          retList[retList.length] = obj;

      if(err){
          obj['msg'] = "System error at iQuippo";
          return callback();
      }else if(valArr.length == 0){
          obj['msg'] = "Record not found at iQuippo";
          return callback();
      }else{
         var updateObj = {};
          keys.forEach(function(key){
            updateObj[parameters[key]] = dt[key];
          });
          updateObj.status = EnterpriseValuationStatuses[3];
          updateObj.statuses = valArr[0].statuses;
          var stsObj = {};
          stsObj.createdAt = new Date();
          stsObj.userId = "IQVL";
          stsObj.status = EnterpriseValuationStatuses[3];
          if(updateObj.statuses)
            updateObj.statuses[updateObj.statuses.length] = stsObj;
           console.log("QV data upadted",updateObj);

          EnterpriseValuation.update({_id:valArr[0]._id},{$set:updateObj},function(err){
            if(err){
              console.log("err",err);
               obj['msg'] = "System error at iQuippo";
            }else{
               obj['success'] = true;
            }
            return callback();
          });
      }
    })
  }
  
  function onComplete(){
    res.status(200).json(retList);
  }

  function getEnterpriseVal(unCtlNo,cb){
    EnterpriseValuation.find({uniqueControlNo:unCtlNo},function(err,retArr){
      cb(err,retArr);
    })
  }

}

function validateRequest(dataArr){

  var requiredParams = [{key:"jobID"},{key:"unique_controll_no"},{key:"reportNo"},{key:"assessed_Value",type : "numeric"},{key:"reportFileToUpload"}];
  var errorList = [];
  var totalItems = dataArr.length;
  for(var i=0; i < totalItems;i++){
    var item = dataArr[i];
    requiredParams.some(function(paramObj){
        var obj = {};
        obj['success'] = false;
        obj['jobID'] = item.jobID;
        obj['unique_controll_no']= item.unique_controll_no;
      if(!item[paramObj.key]){
        obj['msg'] = paramObj.key + " is missing";
        errorList[errorList.length] = obj;
        dataArr.splice(i,1);
        return true;
      }else{
        if(paramObj.type){
            if(!valiadeDataType(item[paramObj.key],paramObj.type)){
              obj['msg'] = paramObj.key + " must be of " + paramObj.type + " type";
              errorList[errorList.length] = obj;
              dataArr.splice(i,1);
              return true;

            }
        }
      }
    });
  }
  return errorList;
}

function valiadeDataType(val,type){
  var ret = true; 
  switch(type){
    case"numeric":
      ret = !isNaN(val);
    break;
  }
  return ret;
}

exports.exportExcel = function(req,res){
  var queryParam = req.query;
  console.log("@@@@@@",queryParam.type);
  var filter = {};
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

  //jsonToXSLX(req,res,dataArr,allowedHeaders);
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