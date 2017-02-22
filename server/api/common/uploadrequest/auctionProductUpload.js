'use strict';

var Model = require('./uploadrequest.model');
var util = require('util');
var async = require('async');
var commonFunc = require('./commonFunc');

function _insertAuctionData(uploadData, cb) {
	var productCols = ['assetId', 'productId', 'brand', 'category', 'city', 'contactName', 'contactNumber', 'description', 'engineNo', 'invioceDate', 'isSold', 'model', 'originalInvoice', 'registrationNo', 'vatPercentage', 'saleVal'];
	var auctionCols = ['auctionId', 'dbAuctionId', 'endDate', 'external', 'startDate'];
	var userCols = ['_id', 'email', 'mobile'];
	var duplicateRecords = [],
		errObj = [];
	var auctionMap = {};
	var insertData = [];
	async.eachLimit(uploadData, 5, iterator, finalize);

	function iterator(collec, next) {
		var obj = {
			product: {},
			auction: {},
			user: {}
		};

		Model.find({
			'product.assetId': collec.assetId
		}, function(err, aucReq) {
			if (err) {
				errObj.push(collec);
				return next();
			}

			if (aucReq && aucReq.length) {
				duplicateRecords.push({
					Error: 'Already present in quene:' + collec.auctionId,
					rowCount: collec.rowCount
				});

				return next();
			}

			var productFilter = {
				assetId: collec.assetId
			}

			commonFunc.fetchAuction(productFilter, function(err, auction) {
				if (err) {
					errObj.push(collec)
					return next();
				}

				if (auction && auction.length) {
					duplicateRecords.push({
						Error: 'Duplicate Asset Id in same auction:' + collec.assetId,
						rowCount: collec.rowCount
					});
					return next();
				}

				commonFunc.fetchProduct(collec.assetId, function(err, product) {
					if (err) {
						errObj.push(collec)
						return next();
					}

					if (product && product.length) {
						duplicateRecords.push({
							Error: 'Duplicate Asset Id:' + collec.assetId,
							rowCount: collec.rowCount
						});

						return next();
					}

					commonFunc.fetchAuctionMaster(collec.auctionId, function(err, auctionMaster) {
						if (err) {
							errObj.push({
								Error: 'Unable to fetch auction master' + collec.auctionId,
								rowCount: collec.rowCount
							})
							return next();
						}

						if (auctionMaster && !auctionMaster.length) {
							errObj.push({
								Error: 'Auction not exist in auction master ' + collec.auctionId,
								rowCount: collec.rowCount
							})
							return next();
						}

						commonFunc.fetchCategory(collec.category, function(err, categoryData) {
							if (err) {
								errObj.push({
									Error: 'Unable to fetch Category: ' + collec.category,
									rowCount: collec.rowCount
								})
								return next();
							}

							if (categoryData && !categoryData.length) {
								errObj.push({
									Error: 'Category not exists :' + collec.category,
									rowCount: collec.rowCount
								})
								return next();
							}

							var brandFilter = {
								name: collec.brand,
								category: categoryData[0]._doc.name,
								group: categoryData[0]._doc.group.name
							};

							commonFunc.fetchBrand(brandFilter, function(err, brandData) {
								if (err) {
									errObj.push({
										Error: 'Unable to fetch Brand: ' + collec.brand,
										rowCount: collec.rowCount
									})
									return next();
								}

								if (brandData && !brandData.length) {
									errObj.push({
										Error: 'Brand not exists' + collec.brand,
										rowCount: collec.rowCount
									})
									return next();
								}

								var modelFilter = {
									name: collec.model,
									category: categoryData[0]._doc.name,
									group: categoryData[0]._doc.group.name,
									brand: brandData[0]._doc.name
								}

								commonFunc.fetchModel(modelFilter, function(err, modelData) {
									if (err) {
										errObj.push({
											Error: 'Unable to fetch Model: ' + collec.model,
											rowCount: collec.rowCount
										})
										return next();
									}

									if (modelData && !modelData.length) {
										errObj.push({
											Error: 'Model not exists :' + collec.model,
											rowCount: collec.rowCount
										})
										return next();
									}

									if (!auctionMap[collec.auctionId]) {
										auctionMap[collec.auctionId] = [];
									}

									if (auctionMap[collec.auctionId].indexOf(collec.assetId) > -1) {
										errObj.push({
											Error: 'Same asset id in excel for same auction id: ' + collec.assetId,
											rowCount: collec.rowCount
										});

										return next();
									}

									auctionMap[collec.auctionId].push(collec.assetId);

									collec.dbAuctionId = auctionMaster[0]._id;
									productCols.forEach(function(x) {
										if (collec[x]) {
											if (x === 'invioceDate')
												collec[x] = new Date(collec[x]);
											obj.product[x] = collec[x];
										}
									});

									auctionCols.forEach(function(x) {
										if (collec[x])
											obj.auction[x] = collec[x]
									})

									userCols.forEach(function(x) {
										if (collec.user && collec.user[x])
											obj.user[x] = collec.user[x];
									})

									obj.type = 'auction';
									obj.lotNo = collec.lotNo;
									insertData.push(obj);

									return next();
								})
							})
						})
					})
				})
			})
		})
	}

	function finalize(err) {
		if (err) {
			util.log(err);
			return cb(err);
		}

		var response = {};
		if (insertData.length) {
			Model.create(insertData, function(err, response) {
				if (err) {
					errObj = errObj.concat(insertData);
					return cb(errObj);
				}

				response = {
					errObj: errObj,
					successObj: insertData.length,
					duplicateRecords: duplicateRecords
				};

				return cb(null, response);
			});
		} else {
			response = {
				errObj: errObj,
				successObj: 0,
				duplicateRecords: duplicateRecords
			};

			return cb(null, response);
		}
	}
}

var auctionProductUpload = {
	upload: function(uploadData, cb) {
		return _insertAuctionData(uploadData, cb);
	}
};



module.exports = auctionProductUpload;