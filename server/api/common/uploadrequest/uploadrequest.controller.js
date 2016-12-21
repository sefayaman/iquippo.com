'use strict';

var APIError = require('../../../components/_error');
var Model = require('./uploadrequest.model');
var AuctionModel = require('../../auction/auction.model');
var ProductModel = require('../../product/product.model');
var AuctionMasterModel = require('../../auction/auctionmaster.model')
var util = require('util');
var async = require('async');

//AA:this function create uplaod data in bulk

function fetchAuction(auctionId, cb) {
	AuctionModel.find({
		auctionId: auctionId
	}).exec(function(err, auction) {

		if (err) {
			return cb(err);
		}

		return cb(null, auction);
	});
}

function fetchProduct(assetId, cb) {
	ProductModel.find({
		assetId: assetId
	}).exec(function(err, product) {
		if (err) {
			return cb(err);
		}
		return cb(null, product);
	});
}

function fetchAuctionMaster(auctionId, cb) {
	AuctionMasterModel.find({
		auctionId: auctionId
	}).exec(function(err, auction) {

		if (err) {
			return cb(err);
		}

		return cb(null, auction);
	});
}

function _insertAuctionData(uploadData, cb) {
	var productCols = ['assetId', 'brand', 'category', 'city', 'contactName', 'contactNumber', 'description', 'engineNo', 'invioceDate', 'isSold', 'model', 'originalInvoice'];
	var auctionCols = ['auctionId', 'dbAuctionId', 'endDate', 'external', 'startDate'];
	var userCols = ['_id', 'email', 'mobile'];
	var duplicateRecords = [],
		successObj = [],
		errObj = [];
	var insertData = [];
	async.eachLimit(uploadData, 5, iterator, finalize);

	function iterator(collec, cb) {
		var obj = {
			product: {},
			auction: {},
			user: {}
		};

		fetchAuction(collec.auctionId, function(err, auction) {
			if (err) {
				errObj.push(collec)
				return cb();
			}

			if (auction && auction.length) {
				duplicateRecords.push({
					Error: 'Duplicate Auction Id:' + collec.auctionId,
					rowCount: collec.rowCount
				});
				return cb();
			}

			fetchProduct(collec.assetId, function(err, product) {
				if (err) {
					errObj.push(collec)
					return cb();
				}

				if (product && product.length) {
					duplicateRecords.push({
						Error: 'Duplicate Asset Id:' + collec.assetId,
						rowCount: collec.rowCount
					});

					return cb();
				}

				fetchAuctionMaster(collec.auctionId, function(err, auctionMaster) {
					if (err) {
						errObj.push({
							Error: 'Unable to fetch auction master' + collec.auctionId,
							rowCount: collec.rowCount
						})
						return cb();
					}

					if (!auctionMaster.length) {
						errObj.push({
							Error: 'Auction not exist in auction master' + collec.auctionId,
							rowCount: collec.rowCount
						})
						return cb();
					}

					collec.dbAuctionId = auctionMaster[0]._id;

					productCols.forEach(function(x) {
						if (collec[x])
							obj.product[x] = collec[x];
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

					return cb();
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

var uploadrequest = {
	fetch: function(req, res, next) {
		Model.find({}, function(err, requestData) {
			if (err)
				return res.sendStatus(500).json({
					err: err
				});

			if (!requestData)
				return next(new APIError(400, 'Error while fetching data'));

			req.requestData = requestData;
			return next();

		})
	},
	renderJson: function(req, res, next) {
		if (!req && !req.requestData)
			return next(new APIError(400, 'No Report Data to render'));

		res.status(200).json(req.requestData);
	},

	delete: function(req, res, next) {
		var id = req.body._id;
		if (!id)
			return res.status(412).json({
				err: 'Id missing'
			});

		Model.find({
			_id: id
		}).remove().exec(function(err, doc) {
			if (err) {
				res.status(500).json({
					err: err
				});
			}

			res.status(200).json({
				msg: 'Deleted Successfully'
			});

		});
	},
	create: function(data, cb) {
		var uploadData = data.uploadData;
		var type = data.type || 'auction';

		switch (type) {
			case 'auction':
				_insertAuctionData(uploadData, cb);
				break;
			default:
				return cb(new APIError(400, 'Invalid Choice'));
		}
	}
};
module.exports = uploadrequest;