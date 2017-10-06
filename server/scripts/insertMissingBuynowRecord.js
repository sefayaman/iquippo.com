'use strict';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var Negotiation = require('./../api/negotiation/negotiation.model');
var UserModel = require('./../api/user/user.model');
var ProductModel = require('./../api/product/product.model');
var async = require('async');
var fs = require('fs');
var util = require('util');
var  xlsx = require('xlsx');
var trim = require('trim');
var config = require('./../config/environment');
//var filePath = process.env.HOME + "/temp/Buynow_Report_data.xlsx";
var filePath = "./Buynow_Report_Data.xlsx";
var mongoose = require('mongoose');
util.log("data file path >>>> ",filePath);
// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  util.error('MongoDB connection error: ' + err);
  process.exit(-1);
});


var BUY_REQUEST_FIELD_MAP = {
                              'Ticket Id' : 'ticketId',
                              'Full Name' : 'fullName',
                              'Country' : 'userCountry',
                              'Location' : 'userCity',
                              'Phone No.' : 'userPhone',
                              'Mobile No.' : 'userMobile',
                              'Email Address' : 'userEmail',
                              'Buy Now Price' : 'buyNowPrice',
                              'Make an Offer Price' : 'offer',
                              'Asset ID' : 'productAssetId',
                              'Product Name' : 'productName',
                              'Location of Asset' : 'productCity',
                              'Manufacturing Year' :'productMfgYear',
                              'Seller Name' : 'sellerFullName',
                              'Seller Contact Number' : 'productSellerMobile',
                              'Date of Request' : 'createdAt'
                            };

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
  var keys = Object.keys(BUY_REQUEST_FIELD_MAP);
  var dataArr = [];
  data.forEach(function(item){
  	var obj = {};
  	keys.forEach(function(key){
  		obj[BUY_REQUEST_FIELD_MAP[key]] = item[key];
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
  	 async.parallel([BuynowRequest,validateProduct,validateDate,validateUser],middleManProcessing);

    function BuynowRequest(callback){
    	if(!row.ticketId)
    		return callback("Missing unique control no.");
  		Negotiation.find({ticketId:row.ticketId},function(err,result){
  			if(err || !result)
  				return callback('Error while validating valuation request.');
  			if(result.length)
  				return callback('Ticket Id -'+ row.ticketId + ' already exist.');
  			return callback();
  		});  	
    }

    function validateUser(callback){
    	if(!row.userMobile)
    		return callback("User is missing");
      UserModel.find({mobile:row.userMobile,deleted:false},function(err,users){
    		if(err) 
    			return callback("Error in validating user");
    		if(!users.length)
    			return callback("User not found");
    		row.user = users[0];
    		return callback();
    	});
    }

    function validateProduct(callback){
      if(!row.productAssetId)
    		return callback("Product is missing");
      var assetId = trim(row.productAssetId);
      ProductModel.find({assetId:assetId,deleted:false},function(err,product){
    		if(err) 
    			return callback("Error in validating user");
    		if(!product.length)
    			return callback("Product not found");
    		row.product = product[0];
    		return callback();
    	});
    }

    function validateDate(callback){
    	var dateFields = ['createdAt'];
    	dateFields.forEach(function(key){
        if(row[key] && row[key] !== '0000-00-00 00:00:00')
    			row[key] = new Date(row[key]);
    		else
    			delete row[key];
    	});
    	return callback();
    }

    function middleManProcessing(err,result){
      if(err){
        errObj.push({
          Error: err,
          rowCount: row.rowCount
        });
        return cb();
      }
      if(row.ticketId.indexOf('BN') !== -1){
      	row.type = 'BUY';
     	  row.negotiation = false; 	
      }
      if(row.ticketId.indexOf('SB') !== -1){
      	row.type = 'BUY_NEGOTIATE';
     	  row.negotiation = true; 	
      }
      row.offer = row.offer;
      row.createdAt = row.createdAt;
      
		Negotiation.create(row, function(err, enterpriseData) {
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
	(function() {
		init(function(err, errList) {
			if (err) {
				util.log(err);
				return process.exit(1);
			}
			if(errList.length)
				util.log("Some record have issue.Please see error message");
			else
				util.log("All record inserted successfully");
			return process.exit(0);
		});
	}());
}