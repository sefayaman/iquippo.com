'use strict';

var fs = require('fs');

var AdmZip = require('adm-zip');
var config = require('./../config/environment');
var UploadRequestModel = require('../api/common/uploadrequest/uploadrequest.model');
var AuctionController = require('../api/auction/auction.controller');
var APIError = require('./_error');
var async = require('async');

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

function _extractImages(taskData) {
	var filename = taskData.taskInfo.filename;
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
					return next('Error while uploading images', data);
				}

				data.forEach(function(x) {
					var product = x.product;
					var obj = {};
					product.images = [];
					product.assetDir = new Date().getTime();
					if (imagesObj[product.assetId] && imagesObj[product.assetId].length) {
						obj = {};
						taskData.zip.extractEntryTo(imagesObj[product.assetId][0].entryName, config.uploadPath + "/auction/" + product.assetDir + "/", false);
						product.primaryImage = imagesObj[product.assetId][0].name;
						imagesObj[product.assetId].splice(0, 1);
						if (imagesObj[product.assetId].length)
							product.otherImages = imagesObj[product.assetId];
						obj.product = product;
						obj.user = x.user;
						obj.dbAuctionId = x.auction.dbAuctionId;
						obj.lotNo = x.lotNo;
						obj.auctionId = x.auction.auctionId;
						obj.startDate = x.auction.startDate;
						obj.endDate = x.auction.endDate;
						obj.statuses = [{
							createdAt: new Date(),
							status: x.status,
							userId: x.user._id
						}];
						obj.status = 'request_approved';
						obj.external = true;

						approvedObj.push(obj);
						approvedIds.push(x._id.toString());
					}
				})

				var rejectIds = [];
				if (approvedObj.length) {
					async.eachLimit(approvedIds, 5, iterator, finalize);
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
					AuctionController.bulkCreate(approvedObj, function(response) {
						if (response && response.Error && response.errObj && !response.sucessObj) {
							taskData.data = data;
							return next(null, taskData);
						}

						if (response && !response.Error && !response.errObj && response.sucessObj) {
							return next(data);
						} else {
							taskData.data = data;
							return next(null, taskData);
						}
					})
				}
			})
			break;
		default:
			return next(null, taskData);
	}
}



module.exports = bulkUpload;