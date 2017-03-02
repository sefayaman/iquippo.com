'use strict';

var APIError = require('../../../components/_error');
var Model = require('./uploadrequest.model');
var async = require('async');
var Utility = require('../../../components/utility');
var commonFunc = require('./commonFunc');
var debug = require('debug')('api.common.uploadrequest.spareUpload');
var _ = require('lodash');

function validateRow(data) {
	var mandatoryCols = ['partNo', 'name', 'madeIn', 'sellerMobile', 'currencyType', 'manufacturers'];
	var missingParams, err;
	missingParams = mandatoryCols.filter(function(x) {
		if (!data[x])
			return x;
	})

	if (missingParams.length)
		err = 'Missing Parameters: ' + missingParams.join(',');

	return err;
}

function _insertSpareData(uploadData, cb) {
	var headers = ['Part_Number*', 'Serial_Number', 'Part_Name*', 'Part_Description', 'Manufacturer*', 'Currency*', 'Price*', 'Price_On_Request*', 'Country_State_Location*', 'Product_Condition', 'Made_In*', 'Payment_Mode', 'Category_Brand_Model_Variant*', 'Commission_Percent', 'Status', 'Seller_Mobile*'];

	var mappings = {
		'Part_Number*': 'partNo',
		'Serial_Number': 'serialNo',
		'Part_Name*': 'name',
		'Part_Description': 'description',
		'Manufacturer*': 'manufacturers',
		'Currency*': 'currencyType',
		'Price*': 'grossPrice',
		'Price_On_Request*': 'priceOnRequest',
		'Country_State_Location*': 'countryStateLocArr',
		'Product_Condition': 'productCondition',
		'Made_In*': 'madeIn',
		'Payment_Mode': 'paymentOption',
		'Category_Brand_Model_Variant*': 'categoryBrandModelArr',
		'Commission_Percent': 'commission',
		'Status': 'status',
		'Seller_Mobile*': 'sellerMobile'
	}

	var options = {
		file: uploadData.filename,
		headers: headers,
		mapping: mappings
	};

	var citiesObj = {},
		modelsObj = {};
	var processedRecords = {};

	var data = Utility.toJSON(options);


	commonFunc.fetchModel({}, function(err, modelData) {
		if (err || !modelData) {
			debug(err);
			return cb(err || new APIError(500, 'Error while fetching model data'));
		}
		var arr = [];
		modelData.forEach(function(x) {
			arr = [];
			arr.push(x.group);
			arr.push(x.category);
			arr.push(x.brand);
			arr.push(x.id);
			if (!modelsObj[x.name])
				modelsObj[x.name] = [];
			modelsObj[x.name].push(arr);
		})

		commonFunc.fetchCities({}, function(err, citiesCollec) {
			if (err || !modelData) {
				debug(err);
				return cb(err || new APIError(500, 'Error while fetching model data'));
			}
			citiesCollec.forEach(function(x) {
				if (!citiesObj[x.name])
					citiesObj[x.name] = [];
				citiesObj[x.name].push(x.state);
			})
			async.eachLimit(data, 5, intitalize, finalize);
		})
	})

	var errObj = [],
		successCount = 0;

	/*
	AA:Process
	here insertCb is the callback for outer async
	*/

	function intitalize(doc, insertCb) {
		debug(doc);
		if (processedRecords[doc.partNo]) {
			errObj.push({
				Error: 'Duplicate record in excel sheet',
				rowCount: doc.__rowNum__
			})
			return insertCb();
		}

		processedRecords[doc.partNo] = true;
		var validLocations = [];
		var validCatBrandModel = [];
		var sellerData;
		var manufacturersData;
		var err = validateRow(doc);
		if (err) {
			errObj.push({
				Error: err,
				rowCount: doc.__rowNum__
			})
			return insertCb();
		}

		if (doc.priceOnRequest && doc.priceOnRequest.toLowerCase() === 'yes') {
			doc.priceOnRequest = true;
		} else
			doc.priceOnRequest = false;

		if (!doc.priceOnRequest && !doc.grossPrice) {
			errObj.push({
				Error: 'Price missing',
				rowCount: doc.__rowNum__
			})
			return insertCb();
		}



		/*AA:
		Validation Process
		1) validate if that record is already present in our upload request
		2) validate if there is already been spart with same part no
		3) validate location (presence of cities in our db)
			constraint: All functionality is only added with city 
		3) validate category,brand,model (presence of cities in our db)
			constraint: All functionality is only added with model
		4)Validate seller from seller mobile
		5) Validate Manfacturer from name
	
		*/
		async.parallel([
			validateExistingReq,
			validatePartInfo,
			vaildateLocation,
			validateCatBrandModel,
			validateSeller,
			validateManfacturer
		], insertData);

		//Here callback is for internal async

		function validateExistingReq(callback) {
			var options = {
				'spareUploads.partNo': doc.partNo
			};

			Model.find(options, function(err, spare) {
				if (err || !spare) {
					debug(err);
					return callback(err || new APIError(400, 'Error while fetching spare list'));
				}

				if (spare.length) {
					return callback('Spare already exists in request quene');
				} else
					return callback();
			})

		}

		function validateManfacturer(callback) {

			commonFunc.fetchManufacturer({
				name: doc.manufacturers
			}, function(err, manu) {

				if (err || !manu) {
					return callback('Error while fetching manufacturers');
				}

				if (!manu.length) {
					return callback('Invalid manufacturers');
				}

				manufacturersData = {
					name: manu[0].name,
					_id: manu[0].id
				};

				return callback();

			})
		}

		function validatePartInfo(callback) {
			var options = {
				'$or': [{
					partNo: doc.partNo
				}],
				deleted: false
			};

			commonFunc.fetchSpare(options, function(err, spare) {
				if (err || !spare) {
					debug(err);
					return callback(err || new APIError(400, 'Error while fetching spare list'));
				}

				if (spare.length) {
					return callback('Spare already exists');
				} else
					return callback();
			})

		}

		function vaildateLocation(callback) {
			var locations = doc.countryStateLocArr.split(';');
			async.eachLimit(locations, 10, init, end);

			function init(x, middleCb) {
				var singleLocationArr = x.split(',');
				if (!singleLocationArr || !singleLocationArr.length) {
					err = 'No Location,cities and country found';
					return middleCb();
				}

				if (singleLocationArr.length < 3) {
					err = 'Missing Country/State/City';
					return middleCb();
				}

				if (singleLocationArr[2].toLowerCase() !== 'all') {
					var locationsList = citiesObj[singleLocationArr[2]];
					if (!locationsList || !locationsList.length) {
						err = 'Invalid Locations';
						return middleCb();
					}
					locationsList.forEach(function(l) {
						if (singleLocationArr[0] === l.country && singleLocationArr[1] === l.name) {
							validLocations.push({
								country: l.country,
								state: l.name,
								city: singleLocationArr[2]
							});
						}
					})
					return middleCb();
				} else {
					commonFunc.fetchCities({
						'state.country': singleLocationArr[0],
						'state.name': singleLocationArr[1]
					}, function(fetchErr, citiesList) {
						if (fetchErr || !citiesList) {
							err = 'Invalid state or country';
							return middleCb();
						}

						if (!citiesList.length) {
							err = 'No locations found for the country/state';
							return middleCb();
						}

						citiesList.forEach(function(x) {
							validLocations.push({
								country: x.state.country,
								state: x.state.name,
								city: x.name
							})
						})

						return middleCb();
					})
				}
			}

			function end(middleErr) {
				debug(middleErr);
				return callback(middleErr);
			}
		}


		function validateCatBrandModel(callback) {
			var catBrandModels = doc.categoryBrandModelArr.split(';');

			async.eachLimit(catBrandModels, 10, init, end);

			function init(row, middleCb) {
				var singleCatBrandModel = row.split(',');
				var variant;
				if (!singleCatBrandModel || !singleCatBrandModel.length) {
					err = 'No Category,Brand and model found';
					return middleCb();
				}

				if (singleCatBrandModel.length < 3) {
					err = 'Missing Category/Brand/Model';
					return middleCb();
				}

				if (singleCatBrandModel[3])
					variant = singleCatBrandModel[3];

				if (singleCatBrandModel[2].toLowerCase() !== 'all') {
					var modelsList = modelsObj[singleCatBrandModel[2]];
					if (!modelsList || !modelsList.length) {
						err = 'Invalid Locations';
						return middleCb();
					}
					modelsList.forEach(function(l) {
						if (singleCatBrandModel[0] === l[1].name && singleCatBrandModel[1] === l[2].name) {
							validCatBrandModel.push({
								category: l[1],
								brand: l[2],
								model: {
									name: singleCatBrandModel[2],
									_id: l[3]
								},
								variant: variant || ''
							});
						}
					})

					return middleCb();
				} else {
					commonFunc.fetchModel({
						'category': singleCatBrandModel[0],
						'brand': singleCatBrandModel[1]
					}, function(fetchErr, modelsList) {
						if (fetchErr || !modelsList) {
							err = 'Invalid category or barnd';
							return middleCb();
						}

						if (!modelsList.length) {
							err = 'No models found for the category/brand';
							return middleCb();
						}

						modelsList.forEach(function(x) {
							validCatBrandModel.push({
								category: x.category,
								brand: x.brand,
								model: {
									name: x.name,
									_id: x.id
								},
								variant: variant || ''
							})
						})
						return middleCb();
					})
				}

			}

			function end(middleErr) {
				debug(middleErr);
				return callback(middleErr);
			}

		}

		function validateSeller(callback) {

			commonFunc.fetchUser({
				mobile: doc.sellerMobile
			}, function(err, sellerInfo) {
				if (err || !sellerInfo) {
					return callback('Error while fetching seller information');
				}

				if (!sellerInfo.length)
					return callback('No seller found');


				sellerData = {
					country: sellerInfo[0].country,
					email: sellerInfo[0].email,
					fname: sellerInfo[0].fname,
					lname: sellerInfo[0].lname,
					role: sellerInfo[0].role,
					_id: sellerInfo[0].id,
					userType: sellerInfo[0].userType,
					mobile: sellerInfo[0].mobile,
					phone: sellerInfo[0].phone
				};
				return callback();
			})
		}

		function insertData(validationErr, validData) {
			debug(validData);
			if (validationErr) {
				errObj.push({
					Error: validationErr,
					rowCount: doc.__rowNum__
				})
				return insertCb();
			}

			var validStatus = ['active', 'sold'];

			if (validStatus.indexOf(doc.status && doc.status.toLowerCase()) < 0) {
				doc.status = 'inactive';

			}

			doc.isSold = false;

			if(doc.status.toLowerCase() === 'sold')
				doc.isSold = true;


			var validConditions = ['used', 'new'];

			if (validConditions.indexOf(doc.productCondition && doc.productCondition.toLowerCase()) < 0) {
				doc.productCondition = '';
			}

			if (!validCatBrandModel.length) {
				errObj.push({
					Error: 'No valid category,brand,model',
					rowCount: doc.__rowNum__
				})
				return insertCb();
			}

			if (!validLocations.length) {
				errObj.push({
					Error: 'No valid location',
					rowCount: doc.__rowNum__
				})
				return insertCb();
			}

			validLocations = _.uniq(validLocations, function(e) {
				return e.country, e.state, e.city;
			});

			validCatBrandModel = _.uniq(validCatBrandModel, function(e) {
				return e.category.name, e.brand.name, e.model.name;
			});

			var validPayOptions = ['Online', 'Offline', 'COD'];

			doc.paymentOption = doc.paymentOption && doc.paymentOption.split(',');
			if (doc.paymentOption && doc.paymentOption.length) {
				doc.paymentOption.forEach(function(x,idx) {
					if(validPayOptions.indexOf(x) < 0){
						doc.paymentOption.splice(idx,1);
					}
				})
			}


			var spareDetails = {
				partId: doc.partId,
				madeIn: doc.madeIn,
				seller: sellerData,
				partNo: doc.partNo,
				serialNo: doc.serialNo,
				name: doc.name,
				description: doc.description,
				manufacturers: manufacturersData,
				grossPrice: doc.grossPrice,
				productCondition: doc.productCondition && doc.productCondition.toLowerCase(),
				commission: doc.commission,
				spareDetails: validCatBrandModel,
				locations: validLocations,
				paymentOption: doc.paymentOption,
				priceOnRequest: doc.priceOnRequest,
				currencyType: doc.currencyType,
				status: doc.status && doc.status.toLowerCase(),
				isSold : doc.isSold,
				deleted: false,
				inquiryCounter: 0
			};

			Model.create({
				user: uploadData.user,
				spareUploads: spareDetails,
				type: 'spareUpload'
			}, function(err, response) {
				if (err || !response) {
					errObj.push({
						Error: err || 'Error while inserting data',
						rowCount: doc.__rowNum__
					});
					return insertCb();
				}

				successCount++;
				return insertCb();

			})
		}
	}

	function finalize(err) {
		if (err) {
			debug(err);
		}

		return cb(null, {
			errObj: errObj,
			successObj: successCount,
			duplicateRecords: []
		});
	}

}

var spareUpload = {
	upload: function(uploadData, cb) {
		return _insertSpareData(uploadData, cb);
	}
};
module.exports = spareUpload;