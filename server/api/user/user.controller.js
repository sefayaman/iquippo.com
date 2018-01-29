'use strict';

var _ = require('lodash');
var Seq = require('seq');
var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var xlsx = require('xlsx');
var Product = require('../product/product.model');
var CityModel = require('../common/location.model');
var Vendor = require('../vendor/vendor.model');
var ManpowerUser = require('../manpower/manpower.model');
var Utility = require('./../../components/utility.js');
var userFieldsMap = require('../../config/user_temp_field_map');
var Utillity = require('./../../components/utility');
var commonController = require('./../common/common.controller');
var notification = require('./../../components/notification.js');
var async = require('async');
var APIError = require('../../components/_error');
var USER_REG_REQ="userRegEmailFromAdminChannelPartner";
var Seqgen = require('./../../components/seqgenerator').sequence();
var AppSetting = require('../common/setting.model');
var EnterpriseValuation = require('../enterprise/enterprisevaluation.model');
var AuctionReq = require('../auction/auction.model');
var ValuationReq = require('../valuation/valuation.model');
var PaymentTransaction = require('../payment/payment.model');
var UserRegForAuction = require('../auction/userregisterforauction.model');

var Export_Field_Mapping = {
  "Customer Id" : "customerId",
  "Name" : "name",
  "Email" : "email",
  "PanNumber" : "panNumber",
  "AADHAAR Number" : "aadhaarNumber",
  "Role" : "role",
  "UserType":"userType",
  "Employee Code":"employeeCode",
  "Company" : "company",
  "Mobile No": "mobile",
  "Phone No.":"phone",
  "Country":"country",
  "State":"state",
  "Location":"city",
  "Registered By":"user",
  "Product Uploaded":"user.have_products",
  "Counts" : "user.total_products",
  "Status":"user.status",
  "Identity proof Uploaded":"IDUploaded",
  "Identity Proof Type":"IDType",
  "Address proof Uploaded":"ADUploaded",
  "Address Proof Type":"ADType",
  "Bank Name":"BKName",
  "Branch Name":"BrName",
  "GST Details Provided":"GSTUploaded",
  "Creation Date" : "createdAt"
}


var validationError = function(res, err) {
  console.log(err);
  return res.status(422).json(err);
}; 

var externalValidationError = function(res, err) {
    console.log(err.errors.email.properties);
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function(err, users) {
    if (err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

exports.fetchSingleUser = function(req,res){
  var id = req.params.id;
  if(!validator.isMongoId(id)){
    return res.send(400).json({err:'Invalid id '});
  }

  User.findById(id).exec(function(err,user){
    if(err)
      return res.send(500);

    if(!user)
      return res.send(404).json({err:'Invalid user'});

    return res.json(user);
  });
};


/**
 * Creates a new user
 */
exports.signUp = function(req, res) {
  var newUser = new User(req.body);
  console.log("username::::" + req.body.name);
  newUser.createdAt = new Date();
  newUser.updatedAt = new Date();
  newUser.clientIp=req.connection.remoteAddress;
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({
      _id: user._id
    }, config.secrets.session, {
      expiresInMinutes: 60 * 5
    });
    res.json({
      token: token
    });
  });
};

exports.validateSignup = function(req, res) {
  var filter = {}
  if (!req.body.mobile)
    return res.status(401).send('Insufficient data');
  if (req.body.userid)
    filter._id = {
      $ne: req.body.userid
    };
  if (req.body.mobile)
    filter.mobile = req.body.mobile;
  filter.deleted = false;
  User.find(filter, function(err, users) {
    if (err) {
      return handleError(res, err);
    } else if (users.length > 0) {
      return res.status(200).json({
        errorCode: 1,
        message: "Mobile number is already in used"
      });
    } else {
      if (!req.body.email)
        return res.status(200).json({
          errorCode: 0,
          message: ""
        });

      filter = {};
      if (req.body.userid)
        filter._id = {
          $ne: req.body.userid
        };
      // if(req.body.email)
      filter.email = req.body.email;
      filter.deleted = false;
      User.find(filter, function(err, usrs) {
        if (err) {
          return handleError(res, err);
        } else if (usrs.length > 0) {
          return res.status(200).json({
            errorCode: 2,
            message: "Email is already in used"
          });
        } else
          return res.status(200).json({
            errorCode: 0,
            message: ""
          });
      });
    }
  });
}

exports.parseImportExcel = function(req, res, next) {
  var body = req.body;
  var ret;
  ['filename', 'user'].forEach(function(x) {
    if (!body[x]) {
      ret = x;
    }
  });

  if (ret)
    return next(new APIError(412, 'Missing mandatory parameter: ' + ret));
  var options = {
    file: body.filename,
    headers: Object.keys(userFieldsMap),
    mapping: userFieldsMap,
    notValidateHeaders: true
  };
  req.excelData = Utillity.toJSON(options);
  req.reqType = 'Upload';
  return next();
};

exports.validateExcel = function(req, res, next) {
  var tasksBasedOnRole = {};
  var excelData = req.excelData;
  var user = req.body.user;
  var reqType = req.reqType;

  if (!reqType)
    return next(new APIError(400, 'Invalid request type'));

  if (excelData instanceof Error) {
    return next(new APIError(412, 'Invalid Excel File'));
  }


  var enterpriseAvailedServices = [];
  var uploadData = [];
  var errorList = [];
  var userObj = {};
  req.totalCount = excelData.length;
  async.eachLimit(excelData, 10, initialize, finalize);

  function finalize(err) {
    if (err) {
      return next(new APIError(500, 'Error while updating'));
    }
    if (!uploadData.length && !errorList.length) {
      return res.json({
        successCount: 0,
        errorList: excelData.length,
        totalCount: req.totalCount
      });
    }
    req.errorList = errorList;
    req.uploadData = uploadData;
    next();
  }

  function initialize(row, cb) {
    if (!row.enterpriseId && row.role === 'enterprise'){
      tasksBasedOnRole = {
        validateEmailAddress: validateEmailAddress,
        validateMandatoryCols: validateMandatoryCols,
        validateDupUser: validateDupUser,
        validateLegalEntity: validateLegalEntity,
        validatePan:validatePan,
        validateAadhaar: validateAadhaar,
        validateCity: validateCity,
        validateValuationAgencies:validateValuationAgencies,
        validateAssetInspectionAgencies:validateAssetInspectionAgencies,
        validateFinanceAgencies:validateFinanceAgencies,
        validateEnterpriseAvailedServices:validateEnterpriseAvailedServices
      };
      row.enterpriseId="E" + row.mobile + "" + Math.floor(Math.random() *10);
      row.enterprise=true;
    }
    else if(row.enterpriseId && row.role === 'enterprise'){
      tasksBasedOnRole = {
        validateEmailAddress: validateEmailAddress,
        validateMandatoryCols: validateMandatoryCols,
        validateDupUser: validateDupUser,
        validateEnterprise: validateEnterprise,
        validateLegalEntity: validateLegalEntity,
        validatePan: validatePan,
        validateAadhaar: validateAadhaar,
        validateCity: validateCity
      };
      if(row.vapprovalRequired)
        delete row.vapprovalRequired;
      if(row.aapprovalRequired)
        delete row.aapprovalRequired;
      if(row.fapprovalRequired)
        delete row.fapprovalRequired;
    }
    else if (row.role !== 'enterprise'){
      tasksBasedOnRole = {
        validateEmailAddress: validateEmailAddress,
        validateMandatoryCols: validateMandatoryCols,
        validateDupUser: validateDupUser,
        validateLegalEntity: validateLegalEntity,
        validatePan: validatePan,
        validateAadhaar: validateAadhaar,
        validateCity: validateCity,
      };
      if(row.vapprovalRequired)
        delete row.vapprovalRequired;
      if(row.aapprovalRequired)
        delete row.aapprovalRequired;
      if(row.fapprovalRequired)
        delete row.fapprovalRequired;
      if(row.valuationPartnerId)
        delete row.valuationPartnerId;
      if(row.assetInspectionPartnerId)
        delete row.assetInspectionPartnerId;
      if(row.financePartnerId)
        delete row.financePartnerId;
      if(row.enterpriseId)
        delete row.enterpriseId;
      if(row.employeeCode)
        delete row.employeeCode;
    }
    if (reqType === 'Upload') {
      if (!userObj[row.mobile]) {
        userObj[row.mobile] = true;
        async.parallel(tasksBasedOnRole, buildData);
      } else {
        errorList.push({
          Error: 'Duplicate Records in excel sheet',
          rowCount: row.rowCount
        });
        return cb();
      }
    }

    function validateLegalEntity(callback) {
      if (row.userType === 'Legal Entity') {
        if (!row.company) {
          errorList.push({
            Error: 'Missing mandatory parameter : Legal_Entity_Name',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
      } else {
        if (row.company) {
          delete row.company;
        }
      }
      return callback();
    }

    function validateValuationAgencies(callback) {
      if (!row.valuationPartnerId)
        return callback();
      Vendor.find({
        "partnerId":row.valuationPartnerId 
      }, function(err, vendors) {
        if (err) {
          errorList.push({
            Error: 'Error while validating vendor',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        if (vendors.length > 0){ 
         return callback();
       }
         else{
          errorList.push({
            Error:'Error while validating Vendor : vendorId:'+ row.valuationPartnerId ,
          });
          return callback('Error');
         }  
        });
    }

    function validateAssetInspectionAgencies(callback) {
       if (!row.assetInspectionPartnerId)
        return callback();
      Vendor.find({
        "partnerId":row.assetInspectionPartnerId 
      }, function(err, vendors) {
        if (err) {
          errorList.push({
            Error: 'Error while validating vendor',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        if (vendors.length > 0){ 
         return callback();
       }
         else{
          errorList.push({
            Error:'Error while validating Vendor : vendorId:'+ row.assetInspectionPartnerId ,
          });
          return callback('Error');
         }  
        });
    }

    function validateFinanceAgencies(callback) {
      if (!row.financePartnerId)
        return callback();
      Vendor.find({
        "partnerId":row.financePartnerId 
      }, function(err, vendors) {
        if (err) {
          errorList.push({
            Error: 'Error while validating vendor',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        if (vendors.length > 0){ 
         return callback();
       }
         else{
          errorList.push({
            Error:'Error while validating Vendor : vendorId:'+ row.financePartnerId ,
          });
          return callback('Error');
         }  
        });
    }

    function validateEmailAddress(callback) {
      if (!row.email)
        return callback();

      if (!(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(row.email))) {
        errorList.push({
          Error: 'Error while validating email Id pattern not matching',
          rowCount: row.rowCount
        });
        return callback('Error');
      }
      User.find({
        email: row.email,
        deleted: false
      }, function(err, users) {
        if (err) {
          errorList.push({
            Error: 'Error while validating user',
            rowCount: row.rowCount
          });
          return callback('Error');
        }

        if (users.length) {
          errorList.push({
            Error: 'Duplicate email',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        return callback();
      });
    }

    function validatePan(callback) {
      if (!row.panNumber)
        return callback();
      if (!(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.panNumber))) {
        errorList.push({
          Error: 'Error while validating Pan card pattern not matching',
          rowCount: row.rowCount
        });
        return callback('Error');
      } else
        return callback();
    }

    function validateAadhaar(callback) {
      if (!row.aadhaarNumber)
        return callback();
      if (!(/^\d{4}\s\d{4}\s\d{4}$/.test(row.aadhaarNumber))) {
        errorList.push({
          Error: 'Error while validating Aadhaar Number pattern not matching',
          rowCount: row.rowCount
        });
        return callback('Error');
      } else
        return callback();
    }

    function validateCity(callback) {
      if (row.city) {
        CityModel.City.find({
          name: row.city
        }, function(err, cityInfo) {
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

    function validateMandatoryCols(callback) {
      var error;
      ['role', 'fname', 'lname', 'userType', 'password', 'country', 'state', 'city', 'mobile'].some(function(x) {
        if (!row[x]) {
          error = true;
          errorList.push({
            Error: 'Missing mandatory parameter : ' + x,
            rowCount: row.rowCount
          });
        }
        if (row[x] == "TRUE")
          row[x] = true;
      });
      if (error)
        return callback('Error');
      return callback();
    }

    function validateDupUser(callback) {
      User.find({
        mobile: row.mobile,
        deleted: false
      }, function(err, users) {
        if (err || !users) {
          errorList.push({
            Error: 'Error while validating user',
            rowCount: row.rowCount
          });
          return callback('Error');
        }

        if (users.length) {
          errorList.push({
            Error: 'Duplicate mobile',
            rowCount: row.rowCount
          });
          return callback('Error');
        }
        return callback();
      });
    }


    function validateEnterprise(callback) {
      if (!row.enterpriseId)
        return callback();
      if(!row.employeeCode){
        errorList.push({
          Error:'Missing mandatory parameter : employeeCode'
        })
      }
        User.find({
          "enterpriseId":row.enterpriseId,
          "enterprise":true 
        }, function(err, enterprise) {
          if (err) {
            errorList.push({
              Error: 'Error while validating user',
              rowCount: row.rowCount
            });
            return callback('Error');
          }
          if (enterprise.length > 0) {
                enterprise[0].availedServices.forEach(function(x) {
                  enterpriseAvailedServices.push(x.name);
                });
                row.availedServices = validateAvailedServices(enterpriseAvailedServices);
                return callback();
              }
           else {
            errorList.push({
              Error: 'Error while validating enterprise :'+ row.enterpriseId,
              rowCount: row.rowCount
            });
            return callback('Error');
          }
        });
    }

    function validateEnterpriseAvailedServices(callback) {
      var availedServices = [];
      var data = {};
        if (row.valuation && row.valuation.toLowerCase() === 'checked') {
          data = {};
          data = {
            name: 'Valuation',
            code: 'Valuation',
            sequence: 1,
            checked: true,
          };
          if(row.vapprovalRequired)
          data.approvalRequired=row.vapprovalRequired;

           if(row.valuationPartnerId)
            data.partnerId=row.valuationPartnerId;
          
          if (row.vapprover && row.vapprover.toLowerCase() === 'checked') {
            data.approver = true;
            delete row.vapprover;
          }
          if (row.vrequester && row.vrequester.toLowerCase() === 'checked') {
            data.requester = true;
            delete row.vrequester;
          }
          availedServices.push(data);
          delete row.valuation;
        }
        if (row.assetInspection && row.assetInspection.toLowerCase() === 'checked') {
          data = {};
          data = {
            name: 'Asset Inspection',
            code: 'Inspection',
            sequence: 2,
            checked: true,
          };
          if(row.aapprovalRequired)
          data.approvalRequired=row.aapprovalRequired;
          
          if(row.assetInspectionPartnerId)
            data.partnerId=row.assetInspectionPartnerId;

          if (row.aapprover && row.aapprover.toLowerCase() === 'checked') {
            data.approver = true;
            delete row.aapprover;
          }
          if (row.arequester && row.arequester.toLowerCase() === 'checked') {
            data.requester = true;
            delete row.arequester;
          }
          availedServices.push(data);
          delete row.assetInspection;
        }
        if (row.financing && row.financing.toLowerCase() === 'checked') {
          data = {};
          data = {
            name: 'Financing',
            code: 'Finance',
            sequence: 3,
            checked: true,
          };
          if(row.fapprovalRequired)
          data.approvalRequired=row.fapprovalRequired;
          
          if(row.financePartnerId)
            data.partnerId=row.financePartnerId;

          if (row.fapprover && row.fapprover.toLowerCase() === 'checked') {
            data.approver = true;
            delete row.fapprover;
          }
          if (row.frequester && row.frequester.toLowerCase() === 'checked') {
            data.requester = true;
            delete row.frequester;
          }
          availedServices.push(data);
          delete row.financing;
        }
      if (row.vapprover)
        delete row.vapprover;
      if (row.vrequester)
        delete row.vrequester;
      if (row.approver)
        delete row.aapprover;
      if (row.arequester)
        delete row.arequester;
      if (row.fapprover)
        delete row.fapprover;
      if (row.frequester)
        delete row.frequester;

       row.availedServices=availedServices;
      return callback();
    }

    function validateAvailedServices(enterpriseAvailedServices) {
      var availedServices = [];
      var data = {};
      enterpriseAvailedServices.forEach(function(x) {
        if (row.valuation && row.valuation.toLowerCase() === 'checked' && x === 'Valuation') {
          data = {};
          data = {
            name: 'Valuation',
            code: 'Valuation',
            sequence: 1,
            checked: true,
          };
          if (row.vapprover && row.vapprover.toLowerCase() === 'checked') {
            data.approver = true;
            delete row.vapprover;
          }
          if (row.vrequester && row.vrequester.toLowerCase() === 'checked') {
            data.requester = true;
            delete row.vrequester;
          }
          availedServices.push(data);
          delete row.valuation;
        }
        if (row.assetInspection && row.assetInspection.toLowerCase() === 'checked' && x === 'Asset Inspection') {
          data = {};
          data = {
            name: 'Asset Inspection',
            code: 'Inspection',
            sequence: 2,
            checked: true,
          };
          if (row.aapprover && row.aapprover.toLowerCase() === 'checked') {
            data.approver = true;
            delete row.aapprover;
          }
          if (row.arequester && row.arequester.toLowerCase() === 'checked') {
            data.requester = true;
            delete row.arequester;
          }
          availedServices.push(data);
          delete row.assetInspection;
        }
        if (row.financing && row.financing.toLowerCase() === 'checked' && x === 'Financing') {
          data = {};
          data = {
            name: 'Financing',
            code: 'Finance',
            sequence: 3,
            checked: true,
          };
          if (row.fapprover && row.fapprover.toLowerCase() === 'checked') {
            data.approver = true;
            delete row.fapprover;
          }
          if (row.frequester && row.frequester.toLowerCase() === 'checked') {
            data.requester = true;
            delete row.frequester;
          }
          availedServices.push(data);
          delete row.financing;
        }
      });
      if (row.vapprover)
        delete row.vapprover;
      if (row.vrequester)
        delete row.vrequester;
      if (row.approver)
        delete row.aapprover;
      if (row.arequester)
        delete row.arequester;
      if (row.fapprover)
        delete row.fapprover;
      if (row.frequester)
        delete row.frequester;

      return availedServices;
    }

    function buildData(err, parseData) {
      if (err)
        return cb();
      uploadData.push(row);
      return cb();
    }
  }
};

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

exports.createUserReq = function(req, res, next) {
  if (!req.uploadData.length && !req.errorList.length)
    return next(new APIError(500, 'Error while updation'));

  var successCount = 0;
  if (!req.uploadData.length && req.errorList.length)
    return res.json({
      successCount: successCount,
      errorList: req.errorList,
      totalCount: req.totalCount
    });

  var dataToUpdate = req.uploadData;

  async.eachLimit(dataToUpdate, 5, intialize, finalize);

  function finalize(err) {
    if (err) {
      return next(new APIError(500, 'Error while updation'));
    }

    return res.json({
      successCount: successCount,
      errorList: req.errorList,
      totalCount: req.totalCount
    });
  }

  function intialize(data, cb) {

    data.createdBy = req.body.user;
    data.createdAt = new Date();
    data.updatedAt = new Date();
    data.agree = true;


    if (data.userType === "Individual")
      data.userType = "individual";
    if (data.userType === "Private Entrepreneur")
      data.userType = "private";
    if (data.userType === "Legal Entity")
      data.userType = "legalentity";

    User.create(data, function(err, doc) {
      if (err || !doc) {
        req.errorList.push({
          Error: 'Error while updating information',
          rowCount: data.rowCount
        });
        return cb();
      }
      
      var tplData={};
      var tplName="";
        tplData.fname=data.fname;
        tplData.lname=data.lname;
        tplData.email=data.email;
        tplData.mobile = data.mobile;
        tplData.customerId = doc.customerId;
        //tplData.serverPath=config.serverPath;
        tplData.password=data.password;
        tplName=USER_REG_REQ;
        var emailData = {};
        emailData.to = data.email;
        emailData.notificationType = "email";
        if(data.role == 'customer'){
          emailData.subject = 'New User Registration: Success';
        }
        else if(data.role == 'enterprise'){
          emailData.subject = 'New Enterprise Registration: Success';
        }
        else{
          emailData.subject = 'New Channel Partner Registration: Success';
          }
          
          sendMail(tplData, emailData, tplName);
        
      successCount++;
      return cb();
    });
  }
};

exports.create = function(req, res, next) {
  var newUser = new User(req.body);
  newUser.createdAt = new Date();
  newUser.updatedAt = new Date();


  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    res.json(user);
  });
};


/**
 * Create/Register user API by external/third party //URL: http://localhost:8100/api/users/external_register
 */
exports.externalCreate = function (req, res) {
  
    //console.log(req.body);
    var newUser = new User(req.body);
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();
    
    newUser.save(function(err, user) { 
        if (err) return externalValidationError(res, err);
        res.json(user);
    });
};

/**
 * Get a single user
 */
exports.show = function(req, res, next) {
  var userId = req.params.id;
  User.findById(userId, function(err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

//search based on user userType
exports.getUser = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  filter["deleted"] = false;
  //filter["isManpower"] = false;
  if (req.body.status)
    filter["status"] = true;
  var arr = [];

  /*if(req.body.notManpower) {
    arr[arr.length] = { isManpower: false};
    arr[arr.length] = { isPartner: true};
  }
  if(req.body.notManpower) {
    arr[arr.length] = { isPartner: true, isManpower:false};
    arr[arr.length] = { isPartner: true, isManpower:true};
    arr[arr.length] = { isPartner: false, isManpower:false};
  }*/

  if(req.body.searchstr){
    //console.log("req.body.searchstr", req.body.searchstr);
    arr[arr.length] = { customerId: { $regex: searchStrReg }};
    arr[arr.length] = { fname: { $regex: searchStrReg }};
    arr[arr.length] = { lname: { $regex: searchStrReg }};
    arr[arr.length] = { mobile: { $regex: searchStrReg }};
    arr[arr.length] = { email: { $regex: searchStrReg }};
    arr[arr.length] = { role: { $regex: searchStrReg }};
    arr[arr.length] = { company: { $regex: searchStrReg }};
    arr[arr.length] = { city: { $regex: searchStrReg }};
    arr[arr.length] = { state: { $regex: searchStrReg }};
    arr[arr.length] = { userType: { $regex: searchStrReg }};
  }

  if (req.body.userId)
    filter["createdBy._id"] = req.body.userId;
  if (req.body.enterpriseId)
    filter["enterpriseId"] = req.body.enterpriseId;
  if (req.body.enterprise)
    filter["enterprise"] = req.body.enterprise;
  if (req.body.mobile)
    filter["mobile"] = req.body.mobile;

  if (req.body.mobileno) {
    var contactRegex = new RegExp(req.body.mobileno, 'i');
    filter.mobile = {
      $regex: contactRegex
    };
  }
  if (req.body.contact)
    filter.mobile = req.body.contact;

  if (req.body.userType)
    filter.userType = req.body.userType;

  if (req.body.role)
    filter.role= req.body.role;
  else {
    var typeFilter = {};
    typeFilter.$ne = "admin";
    filter.role= typeFilter;
  }
	if(req.body.onlyUser) {
      filter["role"] = {$in: ['customer', 'channelpartner']};
      //filter["createdBy.role"] = {$ne:"channelpartner"};
    }
  if (arr.length > 0)
    filter.$or = arr;
  var result = {};
  if (req.body.pagination) {
    paginatedUser(req, res, filter, result);
    return;
  }

  var sortObj = {};
  if (req.body.sort)
    sortObj = req.body.sort;
  sortObj.createdAt = -1;

  var query = User.find(filter).sort(sortObj);
  Seq()
    .par(function() {
      var self = this;
      User.count(filter, function(err, counts) {
        result.totalItems = counts;
        self(err);
      })
    })
    .par(function() {
      var self = this;
      query.exec(function(err, users) {
        if (err) {
          return handleError(res, err);
        }
        result.users = users;
        self();
      });
    })
    .seq(function() {
      return res.status(200).json(result.users);
    })
};

function paginatedUser(req, res, filter, result) {
  var pageSize = req.body.itemsPerPage;
  var first_id = req.body.first_id;
  var last_id = req.body.last_id;
  var currentPage = req.body.currentPage;
  var prevPage = req.body.prevPage;
  var isNext = currentPage - prevPage >= 0 ? true : false;
  Seq()
    .par(function() {
      var self = this;
      User.count(filter, function(err, counts) {
        result.totalItems = counts;
        self(err);
      })
    })
    .par(function() {

      var self = this;
      var sortFilter = {
        _id: -1
      };
      if (last_id && isNext) {
        filter._id = {
          '$lt': last_id
        };
      }
      if (first_id && !isNext) {
        filter._id = {
          '$gt': first_id
        };
        sortFilter._id = 1;
      }

      var query = null;
      var skipNumber = currentPage - prevPage;
      if (skipNumber < 0)
        skipNumber = -1 * skipNumber;

      query = User.find(filter).sort(sortFilter).limit(pageSize * skipNumber);
      query.exec(function(err, users) {
        if (!err && users.length > pageSize * (skipNumber - 1)) {
          result.users = users.slice(pageSize * (skipNumber - 1), users.length);
        } else
          result.users = [];
        if (!isNext && result.users.length > 0)
          result.users.reverse();
        self(err);
      });
    })
    .seq(function() {
      return res.status(200).json(result);
    })
    .catch(function(err) {
      handleError(res, err);
    });
}

//get products count on User Ids
exports.getProductsCountOnUserIds = function(req, res) {
  var filter = {};
  filter.deleted = false;
  filter.status = true;
  if (req.body.userIds){
   filter.seller = {};
   filter.seller._id = {
      $in: req.body.userIds
    }; 
  }
  Product.aggregate({
      $match: filter
    }, {
      $group: {
        _id: '$seller._id',
        total_products: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        count: -1
      }
    },
    function(err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {

  var userId = req.params.id;
  Product.find({
    'seller._id': userId,
    deleted: false,
    isSold: false
  }, function(err, prds) {
    if (err) {
      return handleError(res, err);
    }
    if (prds.length > 0) {
      return res.status(200).json({
        errorCode: 1,
        message: "User has products."
      });
    } else {
      User.find({
        'createdBy._id': userId,
        deleted: false
      }, function(err, usrs) {
        if (err) {
          return handleError(res, err);
        }
        if (usrs.length > 0) {
          return res.status(200).json({
            errorCode: 1,
            message: "User has customers."
          });
        } else {
          User.update({
            _id: userId
          }, {
            $set: {
              deleted: true,
              status: false
            }
          }, function(err, user) {
            if (err) {
              return handleError(res, err);
            }
            return res.status(200).json({
              errorCode: 0,
              message: ""
            })
          });
        }
      })
    }
  })

};

// Updates an existing user in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  req.body.updatedAt = new Date();
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    User.update({
      _id: req.params.id
    }, {
      $set: req.body
    }, function(err) {
      if (err) {
        return handleError(res, err);
      }
      var dataObj = {};
      dataObj['user.fname'] = req.body.fname;
      if (req.body.mname)
        dataObj['user.mname'] = req.body.mname;
      dataObj['user.lname'] = req.body.lname;
      if (req.body.email)
        dataObj['user.email'] = req.body.email;
      dataObj['user.mobile'] = req.body.mobile;
      if (req.body.phone)
        dataObj['user.phone'] = req.body.phone;
      dataObj['user.city'] = req.body.city;
      if (req.body.state)
        dataObj['user.state'] = req.body.state;
      if (req.body.imgsrc)
        dataObj['user.imgsrc'] = req.body.imgsrc;
      updateVendor(dataObj, req, res);
      updateManpower(dataObj, req, res);
      if(req.body.mobileUpdate)
        updateMobileInOtherModel(req.body);
      return res.status(200).json(req.body);
    });
  });
};

function updateMobileInOtherModel(data) {
  Product.update({'user.mobile': data.oldMobile},{$set:{'user.mobile':data.mobile}},{multi:true}).exec();
  Product.update({'seller.mobile': data.oldMobile},{$set:{'seller.mobile':data.mobile}},{multi:true}).exec();

  AuctionReq.update({'user.mobile': data.oldMobile},{$set:{'user.mobile':data.mobile}},{multi:true}).exec();
  AuctionReq.update({'seller.mobile': data.oldMobile},{$set:{'seller.mobile':data.mobile}},{multi:true}).exec();

  EnterpriseValuation.update({'agency.mobile': data.oldMobile},{$set:{'agency.mobile':data.mobile}},{multi:true}).exec();
  EnterpriseValuation.update({'enterprise.mobile': data.oldMobile},{$set:{'enterprise.mobile':data.mobile}},{multi:true}).exec();
  EnterpriseValuation.update({'createdBy.mobile': data.oldMobile},{$set:{'createdBy.mobile':data.mobile}},{multi:true}).exec();

  ValuationReq.update({'user.mobile': data.oldMobile},{$set:{'user.mobile':data.mobile}},{multi:true}).exec();
  ValuationReq.update({'seller.mobile': data.oldMobile},{$set:{'seller.mobile':data.mobile}},{multi:true}).exec();
  ValuationReq.update({'valuationAgency.mobile': data.oldMobile},{$set:{'valuationAgency.mobile':data.mobile}},{multi:true}).exec();

  PaymentTransaction.update({'user.mobile': data.oldMobile},{$set:{'user.mobile':data.mobile}},{multi:true}).exec();
  UserRegForAuction.update({'user.mobile': data.oldMobile},{$set:{'user.mobile':data.mobile}},{multi:true}).exec();
}

//update partner
function updateVendor(userData, req, res) {
  var userId = req.params.id;
  userData.updatedAt = new Date();

  Vendor.update({
    'user.userId': userId
  }, {
    $set: userData
  }, function(err, userObj) {
    if (err) {
      console.log('error in partner updation', err);
    }
  });
}

//update manpower
function updateManpower(userData, req, res) {
  var userId = req.params.id;
  userData.updatedAt = new Date();

  ManpowerUser.update({
    'user.userId': userId
  }, {
    $set: userData
  }, function(err, userObj) {
    if (err) {
      console.log('error in manpower updation', err);
    }
  });
}

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function(err, user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      user.updatedAt = new Date();
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

exports.resetPassword = function(req, res) {
  var userId = req.body.userId;
  var newPass = String(req.body.password);
  User.findById(userId, function(err, user) {
    user.password = newPass;
    user.updatedAt = new Date();
    user.save(function(err) {
      if (err) return validationError(res, err);
      res.status(200).send('OK');
    });
  });
};


/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId,
    deleted: false
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    user = user.toObject();
    if (user.isPartner)
      return getPartenerDetail(req, res, user);
    if (user.isManpower)
      return getManpowerDetail(req, res, user);
    addNoCacheHeader(res)
    return res.json(user);
  });
};

function getPartenerDetail(req, res, user) {
  var filter = {};
  filter.deleted = false;
  filter.status = true;
  if (user._id)
    filter['user.userId'] = "" + user._id;
  Vendor.findOne(filter, function(err, partnerData) {
    if (err) {
      return handleError(res, err);
    }
    if (!partnerData) {
      console.log("Not Exist!!!");
    }
    user.partnerInfo = partnerData;
    if (user.isManpower) {
      getManpowerDetail(req, res, user);
    } else {
      addNoCacheHeader(res);
      res.json(user);
    }
  });
}

function getManpowerDetail(req, res, user) {
  var filter = {};
  filter.deleted = false;
  filter.status = true;
  if (user._id)
    filter['user.userId'] = "" + user._id;
  ManpowerUser.findOne(filter, function(err, manpowerData) {
    if (err) {
      return handleError(res, err);
    }
    if (!manpowerData) {
      console.log("Not Exist!!!");
    }
    user.manpowerInfo = manpowerData;
    addNoCacheHeader(res);
    res.json(user);
  });
}
/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

//validate user on email or mobile

exports.validateUser = function(req, res) {
  var filter = {}
  filter.deleted = false;
  if (!req.body.mobile && !req.body.email && !req.body.forAuction)
    return res.status(401).send('Unauthorized');
  
  if (req.body.userId && req.body.forAuction) {
    if (/^\d+$/.test(req.body.userId)) {
      filter.mobile = req.body.userId;
    } else {
      filter.email = req.body.userId.toLowerCase();
    }
  }

  if (req.body.email)
    filter.email = req.body.email;
  if (req.body.mobile)
    filter.mobile = req.body.mobile + "";
  User.find(filter, function(err, users) {
    if (err) {
      return handleError(res, err);
    }
    if (users.length === 0) return res.status(200).json({
      errorCode: 1,
      message: "User not found"
    });
    else if (users.length === 1)
      return res.status(200).json({
        errorCode: 0,
        user: users[0]
      });
    else
      return res.status(200).json({
        errorCode: 2,
        message: "More than one user found"
      });
  });
}

exports.validateOtp = function(req, res) {
  var otp = req.body.otp;
  if (!otp || !req.body.userId)
    return res.status(401).send('Invalid request');

  User.findOne({
    'otp.otp': otp,
    _id:req.body.userId
  }, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Invalid OTP');
    } else {
      var otpTime = new Date(user.otp.createdAt).getTime();
      var currTime = new Date().getTime();
      User.update({
        _id: user._id
      }, {
        $set: {
          otp: {}
        }
      }, function(err, user) {
        if (err) {
          return handleError(res, err);
        }
        if (currTime - otpTime >= 15 * 60 * 1000) {
          return res.status(404).send('OTP has been expired.Please get another otp');
        } else {
          return res.status(200).send(user);
        }
      });
    }
  });
}

function isStatus(status, deleted) {
  if (status && !deleted)
    return "Active";
  else if (!status && !deleted)
    return "Deactive";
  else if (!status && deleted)
    return "Deleted";
  else
    return "";
}

function getRegisteredBy(user) {
  if (!user.createdBy)
    return user.fname + " " + user.lname + ' (Self)';

  if (user.createdBy.role == 'admin')
    return user.createdBy.fname + " " + user.createdBy.lname + ' (Admin)';
  else if (user.createdBy.role == 'channelpartner')
    return user.createdBy.fname + " " + user.createdBy.lname + ' (Channel Partner)';
  else
    return user.createdBy.fname + " " + user.createdBy.lname + ' (Self)';
}

exports.exportUsers = function(req, res) {
  var filter = {};
  filter.deleted = false;
  if (req.body.userId) {
    filter['createdBy._id'] = req.body.userId;
  }
  if (req.body.enterpriseId) {
    filter.enterpriseId = req.body.enterpriseId;
  }
  if(req.body.filter)
    filter = req.body.filter;
  var dateFilter = {};
  if(req.body.fromDate)
    dateFilter['$gte'] = new Date(req.body.fromDate);
  if(req.body.toDate) {
      var toDate = new Date(req.body.toDate);
      var nextDay = toDate.getDate() + 1;
      toDate.setDate(nextDay);
      dateFilter.$lt = toDate;
  }
  if(req.body.fromDate || req.body.toDate)
    filter['createdAt'] = dateFilter;
  var query = User.find(filter).sort({
    createdAt: -1
  }).limit(5000);
  query.exec(
    function(err, users) {
      if (err) {
        return handleError(res, err);
      }
      var csvStr = "";
      var headers = Object.keys(Export_Field_Mapping);
      csvStr += headers.join(',');
      csvStr += "\r\n";
      users.forEach(function(item,idx){
        var idProof = null;
        var adProof = null;
        if(item.kycInfo && item.kycInfo.length){
          item.kycInfo.forEach(function(kyc){
            if(kyc.type === 'Identity Proof')
              idProof = kyc;
            if(kyc.type === 'Address Proof')
              adProof = kyc;
          });
        }

        headers.forEach(function(header){
          var key = Export_Field_Mapping[header];
          var val = "";
          if(key === 'name')
            val =  _.get(item,"fname","") + " " + _.get(item,"mname","") + " " + _.get(item,"lname","");
          else if(key === 'user')
            val = getRegisteredBy(item) || "";
          else if(key === 'Status')
            val = isStatus(item.status, item.deleted);
          else if(key === 'IDUploaded')
            val = idProof?'Yes':'No';
          else if(key === 'IDType' && idProof)
            val = idProof.name || "";
           else if(key === 'ADUploaded')
            val = adProof?'Yes':'No';
          else if(key === 'ADType' && adProof)
            val = adProof.name || "";
          else if(key == 'BKName' && item.bankInfo && item.bankInfo.length && item.bankInfo[0].bankName)
            val = item.bankInfo[0].bankName || "";
          else if(key == 'BrName' && item.bankInfo && item.bankInfo.length && item.bankInfo[0].branch)
            val = item.bankInfo[0].branch || "";
          else if(key == 'GSTUploaded'){
            if(item.GSTInfo && item.GSTInfo.length && item.GSTInfo[0].registrationNo)
              val = 'Yes';
            else
              val = 'No';
          }
          else if(key === 'createdAt'){
            val = Utility.toIST(_.get(item, 'createdAt', ''));
          }
          else
            val = _.get(item,key,"");
         val = Utility.toCsvValue(val);
         csvStr += val + ",";
        });
        csvStr += "\r\n";
      });
      csvStr = csvStr.substring(0,csvStr.length -1);
      return renderCsv(req,res,csvStr);
    });
}

function renderCsv(req,res,csv){
   var fileName =  "userslist_" + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary'); 
}

exports.exportUsersList = function(req, res) {
  AppSetting.find({
		key: 'user_list_file_name'
	}, function(err, result) {
		if (err) {
			return handleError(result, err)
		} else{
      var downloadDir = 'downloads/user-exports';
      var s3Url = config.awsUrl;
      var s3Bucket = config.awsBucket;
      var path = s3Url+s3Bucket+'/'+downloadDir+'/'+result[0].value;
     
      return res.status(200).json(path);
      
    }
  })
}

function getProductData(req, res, users, userIds) {
  var filter = {};
  filter.deleted = false;
  filter.status = true;
  if (userIds){
    //filter.seller={};
  filter['seller._id'] = {
      $in: userIds
    };
  }  
  Product.aggregate({
      $match: filter
    }, {
      $group: {
        _id: '$seller._id',
        total_products: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        count: -1
      }
    },
    function(err, products) {
      if (err) return handleError(err);;
      /*for (var i = 0; i < users.length; i++) {
        var countFlag = false;
        for (var j = 0; j < products.length; j++) {
          if (users[i]._id == products[j]._id) {
            countFlag = true;
            users[i].total_products = products[j].total_products;
            users[i].have_products = "Yes";
            break;
          }
        }
        if (!countFlag) {
          users[i].total_products = 0;
          users[i].have_products = "No";
        }
        //console.log("users[" + i +"]" + users[i]._id + " # " + users[i].total_products+ "#" + users[i].have_products);
      }*/
        //console.log("users====",users);
      var ws_name = "users"
      var wb = new Workbook();
      var ws = excel_from_data(users);
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;
      var wbout = xlsx.write(wb, {
        bookType: 'xlsx',
        bookSST: true,
        type: 'binary'
      });
      res.end(wbout);
    }
  );
}

function handleError(res, err) {
  return res.status(500).send(err);
}

function addNoCacheHeader(res) {
   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
   res.header('Expires', '-1');
   res.header('Pragma', 'no-cache');
}