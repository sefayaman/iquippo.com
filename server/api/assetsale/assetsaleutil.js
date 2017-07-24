'use strict';

var EnterpriseMaster= require('../common/enterprisemaster.model');
var User = require('../user/user.model');

function getValueOnUserFromMasters(filter, callback) {
	var categoryId = "";
	if(filter.categoryId) {
		categoryId = filter.categoryId;
		delete filter.categoryId;
	}
	
	User.findById(filter).exec(function(err, user){
	    if (err)
			return callback(err);
	  	var dataFilter = {};
	    switch (user.role) {
	    	case "enterprise" : 
	    			dataFilter = {};
	    			dataFilter.enterpriseId = user.enterpriseId;
	    			break;
	    	case "channelpartner" : 
	    			dataFilter = {};
	    			dataFilter['user.userId'] = user._id;
	    			break;
	    	case "customer" : 
	    			dataFilter = {};
	    			if(user.createdBy && user.createdBy.role === 'channelpartner')
	    				dataFilter['user.userId'] = user.createdBy._id;
	    			else 
	    				dataFilter['user.userId'] = user._id;
	    			break;
	    }
	    dataData.categoryId = categoryId;
	    getValueFromEnterpirseMaster(dataFilter,function(err, markupPer){
			if(err)
				console.log(err);
			return callback(null, markupPer);
		});
	});
}

function getValueFromEnterpirseMaster(filter, callback) {
	var query = EnterpriseMaster.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			filter = {};
			filter.userRole = "Other";
			var query = EnterpriseMaster.find(filter);
			query.exec(function(err, period) {
				if (err)
					return callback(err);
				return callback(null, period);
			});
		} else {
			return callback(null, result);
		}
	});
}