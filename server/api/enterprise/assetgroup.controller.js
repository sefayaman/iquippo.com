#!/usr/bin/env node

'use strict';

/* jslint node: true */
/*jshint sub:true*/

var APIError = require('../../components/_error');
var debug = require('debug')('api.assetgroup.controller');
var Model = require('./assetgroup.model');
var xlsx = require('xlsx');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var fieldsConfig = require('./fieldsConfig');
var async = require('async');
var validator = require('validator');

var assetGroup = {};

function validateData(options, obj) {
	var madnatoryParams = options.madnatoryParams || [];
	var numericCols = options.numericCols || [];
	var err;
	madnatoryParams.some(function(x) {
		if (!obj[x]) {
			err = 'Missing Parameter:  ' + x;
			return true;
		}
	});

	if (err)
		return err;

	numericCols.some(function(x) {
		if (obj[x] && isNaN(obj[x])) {
			err = 'Invalid Column value for : ' + x;
			return true;
		}
	})

	return err;
}

function parseExcel(options) {
	['fileName'].forEach(function(x) {
		if (!options[x])
			return new Error('Invalid Upload Type with missing : ' + x);
	});

	var fileName = options.fileName;
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
	var field_map = fieldsConfig.ASSETGROUP;
	var err;
	var uploadData = [];
	var errObj = [];
	var totalCount = data.length;
	data.forEach(function(x) {
		var obj = {};
		Object.keys(x).forEach(function(key) {
			obj[field_map[key]] = x[key];
		})
		obj.rowCount = x.__rowNum__;
		err = validateData(options.madnatoryParams, obj);
		if (err) {
			errObj.push({
				Error: err,
				rowCount: x.__rowNum__
			});
		} else {
			obj.user = options.user;
			var numericCols = options.numericCols || [];
			numericCols.forEach(function(x) {
				if (obj[x] && isNaN(obj[x])) {
					delete obj[x];
				}
			});
			var validData = {};
			Object.keys(obj).forEach(function(x) {
				if (obj[x])
					validData[x] = obj[x];
			});
			uploadData.push(validData);
		}
	});

	return {
		errObj: errObj,
		totalCount: totalCount,
		uploadData: uploadData
	};
}

function _create(data, cb) {
	var madnatoryParams = ['valuerGroupId', 'valuerAssetId', 'valuerName', 'valuerCode', 'assetCategory', 'enterpriseName', 'enterpriseId'];
	var numericCols = ['valuerGroupId', 'valuerAssetId'];

	var options = {
		madnatoryParams: madnatoryParams,
		numericCols: numericCols
	};

	var err = validateData(options, data);
	if (err)
		return cb(new APIError(412, err));

	var user = data.user;

	data.createdBy = {
		name: user.userName,
		_id: user._id,
		role: user.role
	};

	data.updatedBy = {
		name: user.userName,
		_id: user._id,
		role: user.role
	};

	delete data.user;


	Model.create(data, function(err, resp) {
		debug(resp);
		if (err || !resp) {
			return cb(err || new APIError(400, 'Error while creating data'));
		}

		return cb('', 'Created Successfully');
	});
}

assetGroup.create = function(req, res, next) {
	var data = req.body;

	if (!data)
		return next(new APIError(412, 'No data sent to create'));

	var filter = {};
	if(!data.valuerCode || !data.enterpriseId || !data.assetCategory)
	  return res.status(401).send('Insufficient data');

	if(data.valuerCode)
	  filter['valuerCode'] = data.valuerCode;
	if(data.enterpriseId)
	  filter['enterpriseId'] = data.enterpriseId;
	if(data.assetCategory)
	  filter['assetCategory'] = data.assetCategory;
  	Model.find(filter, function(err, assetGroupData) {
	    if (err) {
	      return handleError(res, err);
	    }
	    if (assetGroupData.length > 0) 
	      return res.status(201).json({errorCode: 1, message: "Asset group already exist."});
	    
		_create(data, function(err, resp) {
			if (err)
				return res.status(err.status || 500).send(err);

			//return res.status(201).send(resp);
			return res.status(200).json({errorCode:0, message: resp});
		});
	});

};


assetGroup.count = function(req, res, next) {
	var options = req.query;
	var filters = {};

	if (options.searchStr && options.searchStr !== 'undefined') {
		filters['$text'] = {
			'$search': options.searchStr
		}
	}

	return Model.find(filters).count().exec(function(err, count) {
		if (err)
			return next(err);
		return res.status(200).json({
			count: count
		});
	})

}

assetGroup.fetch = function(req, res, next) {
	var query = null;
	var options = req.query || {};
	var filters = {};
	var sort = {
		'_id': -1
	};

	if (options.first_id && validator.isMongoId(options.first_id)) {
		filters._id = {
			'$gt': options.first_id
		};

		sort = {
			'_id': 1
		};
	}

	if (options.last_id && validator.isMongoId(options.last_id)) {
		filters._id = {
			'$lt': options.last_id
		};
	}

	if (options.last_id && validator.isMongoId(options.last_id) && options.first_id && validator.isMongoId(options.first_id)) {
		filters._id = {
			'$gt': options.first_id,
			'$lt': options.last_id
		};
	}

	if (options.searchStr && options.searchStr !== 'undefined') {
		filters['$text'] = {
			'$search': options.searchStr
		}
	}

	try{
		if (options.assetCategory && options.assetCategory !== 'undefined') {
			filters['assetCategory'] = {$regex: new RegExp(options.assetCategory, 'i')};
		}
	}catch(e){

	}

	if(options.enterpriseId)
		filters['enterpriseId'] = options.enterpriseId;
	if(options.partnerId)
		filters['valuerCode'] = options.partnerId;

	filters.deleted = 0;
	if (options.status)
		filters.status = options.status;
	console.log("####",filters);
	query = Model.find(filters);

	query = query.sort(sort);

	options.offset = Math.abs(Number(options.offset));

	if (options.offset)
		query = query.skip(options.offset);

	if (options.type)
		query = query.where('type').equals(options.type);

	// if (!options.all)
	// 	query = query.limit(options.limit || 10);

	query.exec(fetchData);

	function fetchData(err, assetGroupData) {
		if (err)
			return next(err);

		if (!res)
			return next(new APIError(400, 'Error while fetching data from db'));

		if (options.first_id && options.first_id !== 'null')
			assetGroupData = assetGroupData.reverse();
		req.assetGroupData = assetGroupData;
		return next();
	}
};

assetGroup.renderJson = function(req, res, next) {
	if (!req && !req.assetGroupData)
		return next(new APIError(400, 'No Report Data to render'));

	res.status(200).json(req.assetGroupData);
};

// Updates an existing asset group in the DB.
assetGroup.update = function(req, res) {
  var filter = {};
  var _id = req.body._id;
  if (req.body._id) 
    delete req.body._id;
  if(!req.body.valuerCode || !req.body.enterpriseId || !req.body.assetCategory)
    return res.status(401).send('Insufficient data');
	
  if(_id)
     filter['_id'] = {$ne:_id};
  if(req.body.valuerCode)
  	filter['valuerCode'] = req.body.valuerCode;
  if(req.body.enterpriseId)
  	filter['enterpriseId'] = req.body.enterpriseId;
  if(req.body.assetCategory)
  	filter['assetCategory'] = req.body.assetCategory;
  
  req.body.updatedAt = new Date();
  req.body.updatedBy = {
		name: req.body.user.userName,
		_id: req.body.user._id,
		role: req.body.user.role
	};
  Model.find(filter, function(err, assetGroupData) {
    if (err) {
      return handleError(res, err);
    }
    if (assetGroupData.length > 0) {
      return res.status(201).json({errorCode: 1, message: "Asset group already exist."});
    }
    Model.update({
      _id: req.params.id
    }, {
      $set: req.body
    }, function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json({errorCode:0,message:""});
    });
  });
};

assetGroup.delete = function(req, res, next) {
	var id = req.params.id;
	if (!id || !validator.isMongoId(id))
		return next(new APIError(412, 'Invalid id to update'));

	var updateData = {
		status: 0,
		deleted: 1
	};

	Model.update({
		_id: id
	}, {
		'$set': updateData
	}, function(err, resp) {
		if (err || !resp) {
			return next(new APIError(400, 'Error while deleting'));
		}

		return res.status(201).end();

	});
}

assetGroup.uploadExcel = function(req, res,next) {
	var body = req.body;
	var err;
	['fileName', 'user'].some(function(x) {
		if (!body[x]) {
			err = new APIError(412, 'Missing Madnatory Params :  ' + x);
			return true;
		}
	});

	if (err)
		return next(err);
	
	var fileName = req.body.fileName;
	var user = req.body.user;
	var madnatoryParams = ['valuerGroupId', 'valuerAssetId', 'valuerName', 'valuerCode', 'assetCategory', 'enterpriseName', 'enterpriseId'];
	var numericCols = [];

	var options = {
		fileName: fileName,
		numericCols: numericCols,
		madnatoryParams: madnatoryParams
	};

	var parsedResult = parseExcel(options);
	var errObj = [];
	if (parsedResult.errObj && parsedResult.errObj.length)
		errObj = errObj.concat(parsedResult.errObj);
	var uploadData = parsedResult.uploadData;
	var totalCount = parsedResult.totalCount;

	if (!uploadData.length) {
		var result = {
			errObj: errObj
		};

		return res.json(result);
	}

	async.eachLimit(uploadData, 5, intitalize, finalize);

	function intitalize(row, cb) {
		row.user = user;

		_create(row, function(err, resu) {
			debug(err);
			if (err || !resu) {
				errObj.push({
					Error: err.message,
					rowCount: row.rowCount
				});
			}
			return cb();
		});
	}

	function finalize(err) {
		debug(err);

		return res.json({
			msg: (totalCount - errObj.length) + ' out of ' + totalCount + ' uploaded sucessfully',
			errObj: errObj
		});
	}
}

function handleError(res, err) {
  return res.status(500).send(err);
}

module.exports = assetGroup;