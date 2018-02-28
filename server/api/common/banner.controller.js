'use strict';

var _ = require('lodash');
var xslx = require('xlsx');
var Seq = require('seq');
var trim = require('trim');
var Banner = require('./banner.model');
var handlebars = require('handlebars');
var fs = require('fs')
var gm = require("gm");
var _ = require('lodash');
var config = require('./../../config/environment');
var path = require('path');
var utility = require('./../../components/utility.js');

var importPath = config.uploadPath + config.importDir + "/";

var APIError = require('../../components/_error');
var debug = require('debug')('api.productinfo.controller');
//var _ = require('lodash');
var validator = require('validator');
var async = require('async');

	// Get list of banner master
	exports.get = function(req, res) {
		var bodyData = req.query;
		var filter = {};
		filter['deleted'] = false;
		filter['status'] = "active";
		if(bodyData.bannerClick)
			filter['bannerClick'] = bodyData.bannerClick;
		if (bodyData.valid && bodyData.valid == 'y') {
			filter['eDate'] = {
				$gte: new Date()
			};
			filter['sDate'] = {
				$lte: new Date()
			};
		}
		var query = Banner.find(filter).sort({
			sequence: 1
		});
		query.exec(
			function(err, banners) {
				if (err) {
					return handleError(res, err);
				}
				res.setHeader('Cache-Control', 'private, max-age=2592000');
				return res.status(200).json(banners);
			});
	};


	// Creates a new banner master in the DB.
	exports.createBanner = function(req, res) {
		var seq = req.body.sequence;
		Banner.find({
			sequence: seq
		}, function(errObj, bns) {
			if (errObj) {
				return handleError(res, err);
			}
			if (bns.length > 0) {
				return res.status(200).json({
					errorCode: 1,
					message: "Duplicate sequence find"
				});
			}
			Banner.create(req.body, function(err, banner) {
				if (err) {
					return handleError(res, err);
				}
				return res.status(200).json({
					errorCode: 0,
					message: "Banner saved sucessfully"
				});
			});
		})

	};

	// Updates an existing banner master in the DB.
	exports.updateBanner = function(req, res) {
		if (req.body._id) {
			delete req.body._id;
		}
		req.body.updatedAt = new Date();
		Banner.find({
			sequence: req.body.sequence
		}, function(err, banners) {
			if (err) {
				return handleError(res, err);
			}
			if (banners.length > 1 || (banners.length == 1 && banners[0]._id != req.params.id)) {
				return res.status(200).json({
					errorCode: 1,
					message: "Duplicate sequence find"
				});
			}
			Banner.update({
				_id: req.params.id
			}, {
				$set: req.body
			}, function(err) {
				if (err) {
					return handleError(res, err);
				}
				return res.status(200).json({
					errorCode: 0,
					message: "Banner updated sucessfully"
				});
			});
		});
	};

	// Deletes a banner master from the DB.
	exports.deleteBanner = function(req, res) {
		Banner.findById(req.params.id, function(err, banner) {
			if (err) {
				return handleError(res, err);
			}
			if (!banner) {
				return res.status(404).send('Not Found');
			}
			banner.remove(function(err) {
				if (err) {
					return handleError(res, err);
				}
				return res.status(204).send('No Content');
			});
		});
	};

function handleError(res, err) {
	//console.log(err);
	return res.status(500).send(err);
}
