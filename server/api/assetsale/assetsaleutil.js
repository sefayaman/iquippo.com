'use strict';

var EnterpriseMaster= require('../common/enterprisemaster.model');
var User = require('../user/user.model');
var MarkupPrice = require('../common/markupprice.model');
/*
* For enterprise master filter must be like {}
*/

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
	    	case 'enterprisemaster':
	    		getValueFromEnterpirseMaster(filter,callback);
	    	break;
	    	case 'markup':
	    		getMarkupPrice(filter,callback);
	    	break;
	    	case 'assetsalecharge':
	    	break;
	    	case 'emdmaster':
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
			filter.userRole = "Other";
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

function getValueFromEnterpirseMaster(filter, callback) {
	var query = EnterpriseMaster.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			var filterObj = {};
			filterObj.userRole = "Other";
			var query = EnterpriseMaster.find(filterObj);
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



