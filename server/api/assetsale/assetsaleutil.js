'use strict';

var SaleProcessMaster= require('../common/saleprocessmaster.model');
var User = require('../user/user.model');
var MarkupPrice = require('../common/markupprice.model');
var EMDMaster = require('../common/emdcharge.model');
/*
* For enterprise master filter must be like {}
*/

exports.setStatus = function(bid,status,statusField,historyField,userId){ 
        bid[statusField] = status;
        var stsObj = {};
        stsObj.status = status;
        if(userId)
        	stsObj.userId = userId;
        else
        stsObj.userId = "SYSTEM";
        stsObj.createdAt = new Date();
        if(!bid[historyField])
          bid[historyField] = [];
        bid[historyField].push(stsObj);
 }
 
exports.getMasterBasedOnUser = function(userId,filter,type, callback) {
	
	User.find({_id:userId,status:true,deleted:false}).exec(function(err, users){
	    if (err || !users.length)
			return callback("User not found");
		var user = users[0];
	    switch (user.role) {
	    	case "enterprise" : 
	    			filter.enterpriseId = user.enterpriseId;
	    			break;
	    	case "channelpartner" : 
	    			filter['user.userId'] = user._id;
	    			break;
	    	case "customer" : 
	    			if(user.createdBy && user.createdBy.role === 'channelpartner')
	    				filter['user.userId'] = user.createdBy._id;
	    			else 
	    				filter['user.userId'] = user._id;
	    			break;
	    }

	    switch(type){
	    	case 'saleprocessmaster':
	    		getValueFromSaleProcessMaster(filter,callback);
	    	break;
	    	case 'markup':
	    		getMarkupPrice(filter,callback);
	    	break;
	    	case 'assetsalecharge':
	    	break;
	    	case 'emdmaster':
	    		getEmdFromMaster(filter,callback);
	    	break;


	    }
	});
}

function getMarkupPrice(filter, callback) {
	var query = MarkupPrice.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			filter = {};
			filter.userRole = "default";
			var query = MarkupPrice.find(filter);
			query.exec(function(err, markupPrice) {
				if (err)
					return callback(err);
				return callback(null, markupPrice);
			});
		} else {
			return callback(null, result);
		}
	});
}

function getValueFromSaleProcessMaster(filter, callback) {
	var query = SaleProcessMaster.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			var filterObj = {};
			filterObj.userRole = "default";
			var query = SaleProcessMaster.find(filterObj);
			query.exec(function(err, periods) {
				if (err || !periods.length)
					return callback(err);
				return callback(null, periods[0]);
			});
		} else {
			return callback(null, result[0]);
		}
	});
}

function getEmdFromMaster(filter, callback) {
	console.log("tempFilter userId", filter);
	var tempFilter = {};
	if(filter.enterpriseId)
		tempFilter.enterpriseId = filter.enterpriseId;
	if(filter['user.userId'])
		tempFilter['user.userId'] = filter['user.userId'];
	var query = EMDMaster.find(tempFilter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length > 0) {
			var query = EMDMaster.find(filter);
			query.exec(function(err, result) {
			if (err)
				return callback(err);
			if(result.length == 0) {
				tempFilter['category.name'] = "Other";
				var query = EMDMaster.find(tempFilter);
				query.exec(function(err, emdcharge) {
					if (err || !emdcharge.length)
						return callback(err);
					
					return callback(null, emdcharge[0]);
				});
			} else {
				return callback(null, result[0]);
			}
		});
		} else {
			var filterObj = {};
			filterObj.userRole = "default";
			var query = EMDMaster.find(filterObj);
			query.exec(function(err, emdcharge) {
				if (err || !emdcharge.length)
					return callback(err);
				
				return callback(null, emdcharge[0]);
			});
		}
	});
}
/*function getEmdFromMaster(filter, callback) {
	var query = EMDMaster.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			var filterObj = {};
			filterObj.userRole = "Other";
			var query = EMDMaster.find(filterObj);
			query.exec(function(err, emdcharge) {
				if (err || !emdcharge.length)
					return callback(err);
				
				return callback(null, emdcharge[0]);
			});
		} else {
			return callback(null, result[0]);
		}
	});
}*/



