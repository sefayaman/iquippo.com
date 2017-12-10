'use strict';

var fs = require('fs');
var AdmZip = require('adm-zip');
var config = require('./../config/environment');
var UploadRequestModel = require('../api/common/uploadrequest/uploadrequest.model');
var AuctionController = require('../api/auction/auction.controller');
var APIError = require('./_error');
var async = require('async');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'];
var spareController = require('../api/spare/spare.controller');
var utility = require('./utility');


var bulkUpload = {};

function _fetchRequestData(options, cb) {
	var type = options.type;
	UploadRequestModel.find({
		type: type
	}, processData);

	function processData(err, requests) {
		if (err)
			return cb(err);

		if (!requests)
			return cb(new APIError(400, 'Unable to fetch any data'));

		if (!requests.length)
			return cb(404, 'No Request Data Found to process');

		return cb(null, requests);
	}
}

function _uploadToS3(opts, cb) {
	var localFilePath = config.uploadPath + opts.assetDir;
	var dirName = opts.assetDir;
	utility.uploadFileS3(localFilePath, dirName, function(err, data) {
		if (err) {
			console.log(err)
			return cb(err);
		}
		return cb();
	});
}

function _extractImages(taskData) {
	var filename;
	if (taskData && taskData.taskInfo && taskData.taskInfo.filename) {
		filename = taskData.taskInfo.filename;
	} else {
		return new Error('Invalid taskinfo/file');
	}


	try {
		var zip = new AdmZip(config.uploadPath + "temp/" + filename);
		taskData.zip = zip;
		var zipEntries = zip.getEntries();
		var zipEntryObj = {};

		zipEntries.forEach(function(zipEntry) {
			if (!zipEntry.isDirectory) {
				var entryName = zipEntry.entryName;
				var entryNameParts = entryName.split('/');
				var assetId = entryNameParts[entryNameParts.length - 2];
				if (!zipEntryObj[assetId]) {
					zipEntryObj[assetId] = [];
				}
				var obj = {};
				if (zipEntry.name.match(/\.(jpg|jpeg|png)$/i) && zipEntryObj[assetId].length < 8) {
					obj.name = zipEntry.name;
					obj.entryName = zipEntry.entryName;
					zipEntryObj[assetId].push(obj);
				}
			}
		});
		fs.unlink(config.uploadPath + "temp/" + filename);
		return zipEntryObj;
	} catch (exc) {
		console.log(exc);
		return new Error(exc);
	}

}

/*
Process
Fetch all the request data from uploadrequestschema
if any data exists extract images for those assetids
if  image exist for that asset id
	then map the images with the corresponding assetid
	insert that into auction request table
	delete request from uploadRequest table
*/

bulkUpload.init = function(taskData, next) {
	var taskType = taskData.taskType;
	var approvedObj = [];
	var approvedIds = [];
	var spareUploaded = [];
	var uploadedProducts = [];
	switch (taskType) {
		case 'bulkauction':
			var options = {
				type: 'auction'
			};

			_fetchRequestData(options, function(err, data) {
				if (err)
					return next('', taskData);
				if (!data.length)
					return next('', taskData);

				var imagesObj = _extractImages(taskData);

				if (imagesObj instanceof Error) {
					return next('Error while uploading images', taskData);
				}

				async.eachLimit(data, 1, iterate, finish);

				function iterate(x, cb) {
					var product = x.product;
					var obj = {};
					product.images = [];
					product.assetDir = "auction/" + new Date().getTime();
					if (imagesObj[product.assetId] && imagesObj[product.assetId].length) {
						obj = {};
						for (var i = 0; i < imagesObj[product.assetId].length; i++) {
							taskData.zip.extractEntryTo(imagesObj[product.assetId][i].entryName, config.uploadPath + product.assetDir + "/", false);
						}
						product.primaryImg = imagesObj[product.assetId][0].name;
						imagesObj[product.assetId].splice(0, 1);
						if (imagesObj[product.assetId].length) {
							product.otherImages = [];
							for (var j = 0; j < imagesObj[product.assetId].length; j++) {
								product.otherImages.push(imagesObj[product.assetId][j].name)
							}
						}

						product.isSold = product.isSold ? true : false;
						if (product.isSold) {
							product.saleVal = Number(product.saleVal);
						}

						product.originalInvoice = product.originalInvoice ? "Yes" : "No";

						if (product.originalInvoice === "Yes") {
							if (!product.invioceDate) {
								delete product.invoiceDate;
							} else {
								product.invoiceDate = (moment(product.invioceDate, validDateFormat).format('MM/DD/YYYY'));
							}
						} else {
							delete product.invoiceDate;
						}

						if (product.contactNumber) {
							product.contactNumber = Number(product.contactNumber);
						}

						if (product.vatPercentage) {
							product.vatPercentage = Number(product.vatPercentage);
						}

						obj.product = product;
						obj.user = x.user;
						obj.dbAuctionId = x.auction.dbAuctionId;
						obj.lotNo = x.lotNo;
						obj.lot_id = x.auction.lot_id;
						obj.auctionId = x.auction.auctionId;
						obj.startDate = x.auction.startDate;
						obj.endDate = x.auction.endDate;
						obj.external = true;
						obj.statuses = [{
							createdAt: new Date(),
							status: x.status,
							userId: x.user._id
						}];
						obj.status = 'request_approved';
						obj.external = true;
						uploadedProducts.push(product.assetId);
						approvedObj.push(obj);
						approvedIds.push(x._id.toString());
						var opts = {
							assetDir: product.assetDir
						};

						_uploadToS3(opts, function(err, data) {
							if (err) {
								console.log(err);
								return cb(err);
							}
							return cb();
						});

					} else {
						return cb();
					}


				}

				function finish(err) {
					if (err)
						return next(false, taskData);

					var rejectIds = [];
					if (approvedObj.length) {
						async.eachLimit(approvedIds, 5, iterator, finalize);
					} else {
						return next(false, taskData);
					}

					function iterator(approveId, cb) {
						UploadRequestModel.remove({
							_id: approveId
						}, function(err, dt) {
							if (err) {
								console.log(err);
								rejectIds.push(approveId);
							}
							return cb();
						})
					}

					function finalize(err) {
						console.log(err);
						AuctionController.bulkCreate(approvedObj, function(err, response) {
							taskData.data = data;
							if (response && !response.Error && !response.errObj && response.sucessObj) {
								taskData.uploadedProducts = uploadedProducts;
								return next(true, taskData);
							} else {
								return next(false, taskData);
							}
						})
					}
				}
			})
			break;
		case "bulkSpare":
			approvedObj = [];
			options = {
				type: 'spareUpload'
			};

			_fetchRequestData(options, function(err, data) {
				if (err)
					return next('', taskData);
				if (!data.length)
					return next('', taskData);

				var imagesObj = _extractImages(taskData);

				if (imagesObj instanceof Error) {
					return next('Error while uploading images', taskData);
				}
				async.eachLimit(data, 1, iterate, finish);

				function iterate(x, cb) {
					var spareUploads = x.spareUploads;
					var obj = {};
					spareUploads.images = [];
					spareUploads.assetDir = new Date().getTime();
					if (imagesObj[spareUploads.partNo] && imagesObj[spareUploads.partNo].length) {
						obj = {};
						for (var i = 0; i < imagesObj[spareUploads.partNo].length; i++) {
							taskData.zip.extractEntryTo(imagesObj[spareUploads.partNo][i].entryName, config.uploadPath + spareUploads.assetDir + "/", false);
						}
						spareUploads.primaryImg = imagesObj[spareUploads.partNo][0].name;
						if (imagesObj[spareUploads.partNo].length) {
							spareUploads.images = [];
							for (var j = 0; j < imagesObj[spareUploads.partNo].length; j++) {
								spareUploads.images.push({
									"waterMarked": false,
									"isPrimary": false,
									"src": imagesObj[spareUploads.partNo][j].name
								})
							}
						}
						spareUploads.user = x.user;
						spareUploads.spareStatuses = [{
							createdAt: new Date(),
							status: spareUploads.status,
							userId: x.user._id
						}];
						spareUploaded.push(spareUploads.partNo);
						approvedIds.push(x._id.toString());
						approvedObj.push(spareUploads);

						var opts = {
							assetDir: spareUploads.assetDir
						};

						_uploadToS3(opts, function(err, data) {
							if (err) {
								console.log(err);
								return cb(err);
							}
							return cb();
						})
					} else {
						return cb();
					}
				}

				function finish(err) {
					if (err)
						return next(false, taskData);

					var rejectIds = [];
					if (approvedObj.length) {
						async.eachLimit(approvedIds, 5, iterator, finalize);
					} else {
						return next(false, taskData);
					}


					function iterator(approveId, cb) {
						UploadRequestModel.remove({
							_id: approveId
						}, function(err, dt) {
							if (err) {
								console.log(err);
								rejectIds.push(approveId);
							}
							return cb();
						})
					}

					function finalize(err) {
						console.log(err);
						spareController.bulkCreate(approvedObj, function(err, response) {
							taskData.data = data;
							if (response && !response.Error && !response.errObj && response.sucessObj) {
								taskData.spareUploaded = spareUploaded;
								return next(true, taskData);
							} else {
								return next(false, taskData);
							}
						})
					}
				}
			})
			break;
		default:
			return next(null, taskData);
	}
}



module.exports = bulkUpload;