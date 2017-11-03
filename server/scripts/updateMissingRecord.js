process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var EnterpriseValuation = require('./../api/enterprise/enterprisevaluation.model');
var UserModel = require('./../api/user/user.model');
var vendorModel = require('./../api/vendor/vendor.model');
var purposeModel = require("./../api/common/valuationpurpose.model");
var AssetGroupModel = require('./../api/enterprise/assetgroup.model');
var commonFunc = require('./../api/common/uploadrequest/commonFunc');
var async = require('async');
var fs = require('fs');
var util = require('util');
var  xlsx = require('xlsx');
var config = require('./../config/environment');
var filePath = "./Valuation_Request_data.xlsx"
var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Inspection In Progress','Inspection In Completed','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner','Completed'];
var mongoose = require('mongoose');
util.log("data file path >>>> ",filePath);
// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  util.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

var fieldMap = {
  'iquippo_uniquecontrolno':'uniqueControlNo',
  'iquippo_jobid' : 'jobId',
  'contactpersontelno':'customerPartyNo',
  'iquippo_request_date':'requestDate',
  'created_date':'submittedToAgencyDate',
  'iquippo_updated_date':'reportSubmissionDate',
  'iquippo_updated_date':'reportDate',
  'invoiceDate':'customerInvoiceDate',
  'iquippo_repo_date':'repoDate'
}


function init(processCb) {

  var workbook = null;
  try{
    workbook = xlsx.readFile(filePath);
  }catch(e){
    processCb(e);
  }
  if(!workbook)
  	processCb("Error in loading excel file");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];
  var data = xlsx.utils.sheet_to_json(worksheet);
  var keys = Object.keys(fieldMap);
  var dataArr = [];
  data.forEach(function(item){
  	var obj = {};
  	keys.forEach(function(key){
  		obj[fieldMap[key]] = item[key];
  		obj.rowCount = item.__rowNum__;
  	});
  	dataArr[dataArr.length] = obj;
  });
  var errObj = [];
  async.eachLimit(dataArr,5,initialize,function(err){
  	util.log("error detail >>> ",errObj);
  	util.log("Error count  >>>>",errObj.length);
  	processCb(err,errObj);
  });

  function initialize(row,cb){
  	 async.parallel([validateValuationRequest,validateEnterprise,validateRequestType,validatePurpose,validateDate,validateUser,validateYearOfManufacturing,validateAgency,validateMasterData,validateCountry],middleManProcessing);

    function validateValuationRequest(callback){
    	if(!row.uniqueControlNo)
    		return callback("Missing unique control no.");
  		EnterpriseValuation.find({uniqueControlNo:row.uniqueControlNo,deleted:false},function(err,result){
  			if(err || !result)
  				return callback('Error while validating valuation request.');
  			if(!result.length)
  				return callback('Enyerprise valuation request is not found.');
  			return callback();
  		});  	
    }

    function validateUser(callback){
    	if(!row.customerPartyNo)
    		return callback();
    	UserModel.find({mobile:row.customerPartyNo,deleted:false},function(err,users){
    		if(err) 
    			return callback("Error in validating user");
    		if(!users.length)
    			return callback("User not found");
    		row.user = users[0];
        row.customerPartyNo = row.user.mobile;
        row.userName = (row.user.fname || "") + " " + (row.user.mname || "") +(row.user.mname ? " " : "") + (row.user.lname || "");
        row.legalEntityName = (row.user.company || "");
        row.createdBy = {
          name : row.user.fname + " " + row.user.lname,
          _id : row.user._id + "",
          email : row.user.email,
          mobile : row.user.mobile,
          role : row.user.role
        };
    		return callback();
    	});
    }

    function validateEnterprise(callback){
      if(!row.enterpriseName)
        return callback();

      UserModel.find({"enterprise" : true,status:true,deleted:false}).exec(function(err,result){
        if(err)
          return callback('Error while validating enterprise');
        if(!result.length)
          return callback('There are no enterprise in the system');
      	var enterprises = result.filter(function(entUser){
      		var entUserName = (entUser.fname || "") + " " + (entUser.lname || "");
      		 return entUserName === row.enterpriseName;
      	});

      	if(enterprises.length !== 1)
      		return callback('Invalid enterprise');
        row.enterprise = {
          email : enterprises[0].email,
          mobile : enterprises[0].mobile,
          _id : enterprises[0]._id + "",
          enterpriseId : enterprises[0].enterpriseId,
          employeeCode : enterprises[0].employeeCode,
          name : (enterprises[0].fname || "") + " "+ (enterprises[0].lname || "")
        };
        row.customerPartyName = row.enterprise.name;
        return callback();
      });
    }

    function validateRequestType(callback){
      if(!row.requestType)
        return callback();
      if(['Valuation','Inspection'].indexOf(row.requestType) < 0)
        return callback('Invalid Request Type');
      return callback();
    }

    function validateDate(callback){
    	var dateFields = ['requestDate','submittedToAgencyDate','reportSubmissionDate','reportDate','invoiceDate','repoDate'];
    	dateFields.forEach(function(key){
    		if(row[key] && row[key] !== '0000-00-00 00:00:00')
    			row[key] = new Date(_.trim(row[key]));
    		else
    			delete row[key];
    	});
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

      if(!row.purpose)
        return callback();

      if(row.purpose == "Financing")
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

      vendorModel.find({entityName : row.agencyName,deleted:false,status:true},function(err,result){
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
          partnerId : result[0].partnerId,
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
                  row.otherModel = row.model;
                 row.model = "Other";           
              }
              return callback();
          });
        })
    }

    function validateCountry(callback){

      if(!row.country)
        return callback();

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
      if(err){
        errObj.push({
          Error: err,
          rowCount: row.rowCount
        });
        return cb();
      }
      row.createdAt = row.requestDate;
      row.updatedAt = row.requestDate;
      var unc = row.uniqueControlNo;
      delete row.uniqueControlNo;
      delete row.jobId;
      delete row.user;
      //console.log("update field >>>",row);
      EnterpriseValuation.update({uniqueControlNo:unc},{$set:row},function(err, enterpriseData) {
            if(err || !enterpriseData) { 
              errObj.push({
                Error: err,
                rowCount: row.rowCount
              });
            }
            return cb(err);
        });
    }
  }
}

if (require.main === module) {
  console.log("called");
	(function() {
		init(function(err, errList) {
			if (err) {
				util.log(err);
				return process.exit(1);
			}
			if(errList.length)
				util.log("Some record have issue.Please see error message");
			else
				util.log("All record updated successfully");
			return process.exit(0);
		});
	}());
}


