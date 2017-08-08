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
var async = require('async');
var APIError = require('../../components/_error');

var validationError = function(res, err) {
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
/**
 * Creates a new user
 */
exports.signUp = function(req, res, next) {
  var newUser = new User(req.body);
  console.log("username::::" + req.body.name);
  newUser.createdAt = new Date();
  newUser.updatedAt = new Date();
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
    if (row.ifEnterprise === 'yes')
      tasksBasedOnRole = {
        validateEmailAddress: validateEmailAddress,
        validateMandatoryCols: validateMandatoryCols,
        validateDupUser: validateDupUser,
        validateLegalEntity: validateLegalEntity,
        validateEnterprise:validateEnterprise,
        validatePan: validatePan,
        validateAadhaar: validateAadhaar,
        validateCity: validateCity,
        validatingAgencies:validatingAgencies
      };
    else {
      if(row.vapprovalRequired)
        delete row.vapprovalRequired;
      if(row.aapprovalRequired)
        delete row.aapprovalRequired;
      if(row.fapprovalRequired)
        delete row.fapprovalRequired;
      if(row.valuationAgency)
        delete row.valuationAgency;
      if(row.assetInspectionAgency)
        delete row.assetInspectionAgency;
      if(row.financeAgency)
        delete row.financeAgency;
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

    function validateValuationAgencies(CallBack) {
      if (!row.valuationAgency)
        return CallBack();
      Vendor.find({
        "services": {
          $in: ['Valuation']
        }
      }, function(err, vendors) {
        if (err) {
          errorList.push({
            Error: 'Error while validating user',
            rowCount: row.rowCount
          });
          return CallBack('Error');
        }
        
        if (vendors.length) {
        var match=0;
          vendors.some(function(x){
          if (row.valuationAgency === x.entityName) {
            row.vpartnerId = x.partnerId;
            row.vObjectId=x._id;
            match=1;
             return CallBack();
          }  
        });
          if(match === 0)
          {
            errorList.push({
            Error: 'Error while validating valuationAgency',
            rowCount: row.rowCount
          });
          return CallBack('Error');            
          }
        }
        else {
            errorList.push({
              Error: 'Error while validating Valuation Agency No valuation Agency found',
              rowCount: row.rowCount
            });
            return CallBack('Error');
          }
      });
    }

    function validateAssetInspectionAgencies(CallBack) {
      if (!row.assetInspectionAgency)
        return CallBack();
      Vendor.find({
        "services": {
          $in: ['Asset Inspection']
        }
      }, function(err, vendors) {
        if (err) {
          errorList.push({
            Error: 'Error while validating vendor',
            rowCount: row.rowCount
          });
          return CallBack('Error');
        }
        
        if (vendors.length) {
        var match=0;
          vendors.some(function(x){
           if (row.assetInspectionAgency === vendors.entityName) {
            row.apartnerId = vendors.partnerId;
            row.aObjectId=vendors._id;
            match =1;
            return CallBack();
          }       
          });
          if(match === 0){
           errorList.push({
              Error: 'Error while validating Asset Inspection Agency',
              rowCount: row.rowCount
            });
            return CallBack('Error');
          }
        }
        else {
            errorList.push({
              Error: 'Error while validating Asset Inspection Agency',
              rowCount: row.rowCount
            });
            return CallBack('Error');
          }
      });
    }

    function validateFinanceAgencies(CallBack) {
      if (!row.financeAgency)
        return CallBack();
      Vendor.find({
        "services": {
          $in: ['Finance']
        }
      }, function(err, vendors) {
        if (err) {
          errorList.push({
            Error: 'Error while validating user',
            rowCount: row.rowCount
          });
          return CallBack('Error');
        }
        if (vendors.length) {
          var match=0;
          vendors.some(function(x){
          if (row.financeAgency === x.entityName) {
            row.fpartnerId = x.partnerId;
            row.fObjectId=x._id;
             match = 1;
             return CallBack();
          }  
        });
          if(match === 0){
            errorList.push({
              Error: 'Error while validating Finance Agency',
              rowCount: row.rowCount
            });
            return CallBack('Error');
          }
        }
        else {
            errorList.push({
              Error: 'Error while validating Finance Agency',
              rowCount: row.rowCount
            });
            return CallBack('Error');
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
      if (!row.enterprise)
        return callback();

      if (row.role === 'enterprise') {
        User.find({
          "role": "enterprise",
          "enterprise": true,
          "status": true,
          "enterpriseId": {
            $exists: true
          }
        }, function(err, enterprises) {
          if (err) {
            errorList.push({
              Error: 'Error while validating user',
              rowCount: row.rowCount
            });
            return callback('Error');
          }
          if (enterprises.length > 0) {
            var matchFound=0;
            enterprises.some(function(x) {
              if ((x.fname + (x.mname || " ") + (x.lname || "")).toLowerCase() === row.enterprise.toLowerCase()) {
                if(row.ifEnterprise==='yes'){
                 errorList.push({
              Error: 'Duplicate enterprise',
              rowCount: row.rowCount
            });
            return callback('Error'); 
                }
                matchFound=1;  
                row.enterpriseId = x.enterpriseId;
                x.availedServices.forEach(function(x) {
                  enterpriseAvailedServices.push(x.name);
                });
                row.availedServices = validateAvailedServices(enterpriseAvailedServices);
                return callback();
              }
            });
            if(matchFound === 0){
              row.enterpriseId="E" + row.mobile + "" + Math.floor(Math.random() *10);
            return callback(); 
          }
          } else {
            errorList.push({
              Error: 'Error while validating enterprise',
              rowCount: row.rowCount
            });
            return callback('Error');
          }
        });
      }
    }

   function validatingAgencies(callback){
    async.series([validateValuationAgencies,validateAssetInspectionAgencies,validateFinanceAgencies,validateEnterpriseAvailedServices],function(err){
     if(err) return callback(err);
     return callback();
    });
  }

    function validateEnterpriseAvailedServices(CallBack) {
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

           if(row.vpartnerId)
            data.partnerId=row.vpartnerId;
          
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
          
          if(row.apartnerId)
            data.partnerId=row.apartnerId;

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
            code: 'Financing',
            sequence: 3,
            checked: true,
          };
          if(row.fapprovalRequired)
          data.approvalRequired=row.fapprovalRequired;
          
          if(row.fpartnerId)
            data.partnerId=row.fpartnerId;

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
      return CallBack();
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
            code: 'Financing',
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
      //if(req.body.isPartner) {
      updateVendor(dataObj, req, res);
      //}
      //if(req.body.isManpower) {
      updateManpower(dataObj, req, res);
      //}
      return res.status(200).json(req.body);
    });
  });
};

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
    filter.user.userId = "" + user._id;
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
    filter.user.userId = "" + user._id;
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
  filter.deleted= false;
  if (!req.body.mobile && !req.body.email)
    return res.status(401).send('Unauthorized');
  if (req.body.email)
    filter.email = req.body.email;
  if (req.body.mobile)
    filter.mobile = req.body.mobile;
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
  if (!otp)
    return res.status(401).send('Unauthorized');
  //console.log("otp filetr",{'otp.otp':otp})
  User.findOne({
    'otp.otp': otp
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

//export data into excel
function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function setType(cell) {
  if (typeof cell.v === 'number')
    cell.t = 'n';
  else if (typeof cell.v === 'boolean')
    cell.t = 'b';
  else if (cell.v instanceof Date) {
    cell.t = 'n';
    cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  } else cell.t = 's';
}

function excel_from_data(data) {
  var ws = {};
  var range;
  range = {
    s: {
      c: 0,
      r: 0
    },
    e: {
      c: 17,
      r: data.length
    }
  };

  for (var R = 0; R != data.length + 1; ++R) {

    var C = 0;
    var user = null;
    var cell = null;
    if(R != 0)
      user = data[R-1];
   if(R === 0)
      cell = {v: "Customer Id"};
    else {
      if(user)
        cell = {v: user.customerId || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    ws[cell_ref] = cell;

    if(R === 0)
      cell = {v: "Name"};
    else{
      if(user)
        cell =  {v: (user.fname || "") + " " + (user.mname || "") + " " + (user.lname || "")};
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Email"
      };
    else {
      if (user)
        cell = {
          v: user.email || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "PAN Number"
      };
    else {
      if (user)
        cell = {
          v: user.panNumber || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "AADHAAR Number"
      };
    else {
      if (user)
        cell = {
          v: user.aadhaarNumber || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Role"
      };
    else {
      if (user)
        cell = {
          v: user.role || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "UserType"
      };
    else {
      if (user)
        cell = {
          v: user.userType || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R ===0)
      cell = {
        v: "Employee Code"
      };
    else {
      if (user)
        cell = {
          v: user.employeeCode || "NA"
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Company Name"
      };
    else {
      if (user)
        cell = {
          v: user.company || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R ===0)
      cell = {
        v: "Mobile No."
      };
    else {
      if (user)
        cell = {
          v: user.mobile || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Phone No."
      };
    else {
      if (user)
        cell = {
          v: user.phone || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R ===0)
      cell = {
        v: "Country"
      };
    else {
      if (user)
        cell = {
          v: user.country || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "State"
      };
    else {
      if (user)
        cell = {
          v: user.state || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R ===0)
      cell = {
        v: "Location"
      };
    else {
      if (user)
        cell = {
          v: user.city || ""
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Registered By"
      };
    else {
      //if(user)
      cell = {
        v: getRegisteredBy(user) || ""
      };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R ===0)
      cell = {
        v: "Product Uploaded"
      };
    else {
      if (user)
        cell = {
          v: user.have_products
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Counts"
      };
    else {
      if (user)
        cell = {
          v: user.total_products
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R ===0)
      cell = {
        v: "Status"
      };
    else {
      if (user)
        cell = {
          v: isStatus(user.status, user.deleted)
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;

    if (R === 0)
      cell = {
        v: "Creation Date"
      };
    else {
      if (user)
        cell = {
          v: Utility.toIST(_.get(user, 'createdAt', ''))
        };
    }
    setType(cell);
    cell_ref = xlsx.utils.encode_cell({
      c: C++,
      r: R
    });
    ws[cell_ref] = cell;
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
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
    filter.createdBy._id = req.body.userId;
  }
  if (req.body.enterpriseId) {
    filter.enterpriseId = req.body.enterpriseId;
  }
  if (req.body.filter)
    filter = req.body.filter;
  var query = User.find(filter).sort({
    createdAt: -1
  });
  query.exec(
    function(err, users) {
      if (err) {
        return handleError(res, err);
      }
      var userIds = [];
      users.forEach(function(item) {
        userIds[userIds.length] = item._id + "";
      });
      getProductData(req, res, users, userIds);
      // var ws_name = "users"
      // var wb = new Workbook();
      // var ws = excel_from_data(users);
      // wb.SheetNames.push(ws_name);
      // wb.Sheets[ws_name] = ws;
      // var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
      // res.end(wbout);
    });
}

function getProductData(req, res, users, userIds) {
  var filter = {};
  filter.deleted = false;
  filter.status = true;
  if (userIds){
    filter.seller={};
  filter.seller._id = {
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
      for (var i = 0; i < users.length; i++) {
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
      }
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
//create user unique number


exports.createUniqueUserNo = function(req,res){
   
   User.find({}, function (err, users) {
    //if(err) return res.status(500).send(err);
    var i=1;
    users.forEach(function(doc) {
    //if (err) throw err;
     if(doc){
      var id = 100000+i;
       doc.update({$set:{customerId:id}},function(err){
        
        //return res.status(200).json(req.body);
      });
      
      i++;
     }
  });

   res.status(200);console.log("Customer Id created successfully.");
   
  });
   /*res.each(function(doc) {
    //if (err) throw err;
    console.log(doc);
  });*/
}