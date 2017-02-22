'use strict';

var APIError = require('../../../components/_error');
var Model = require('./uploadrequest.model');
var spareUpload = require('./spareUpload');
var auctionProductUpload = require('./auctionProductUpload');

var uploadrequest = {
	fetch: function(req, res, next) {
		Model.find({}, function(err, requestData) {
			if (err)
				return res.sendStatus(500).json({
					err: err
				});

			if (!requestData)
				return next(new APIError(400, 'Error while fetching data'));

			var spareUploads = [],
				productUploads = [];

			requestData.forEach(function(x){
				if(x.type === 'spareUpload')
					spareUploads.push(x)
				else
					productUploads.push(x)
			})

			req.requestData = {
				productUploads : productUploads,
				spareUploads : spareUploads
			};
			
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
				auctionProductUpload.upload(uploadData, cb);
				break;
			case 'spareUpload':
				spareUpload.upload(uploadData, cb);
				break;
			default:
				return cb(new APIError(400, 'Invalid Choice'));
		}
	}
};
module.exports = uploadrequest;