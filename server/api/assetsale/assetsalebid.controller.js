'use strict';

var _ = require('lodash');
var async = require('async');
var trim = require('trim');
var AssetSaleBid = require('./assetsalebid.model');
var APIError = require('../../components/_error');


function create(data, callback) {
	if (!data)
		return callback(new APIError(412, 'No data for creation'));

	/*const allowedCols = ['ticketId', 'userId', 'productId', 'bidAmount','tradeType','status','offerStatus','bidStatus','dealStatus','assetStatus','state','createAt','updatedAt'];
		//var Model = this.Model;
		var validData = {};

		allowedCols.forEach(function(x) {
			if (data[x])
				validData[x] = data[x];
		});
        //validData.type = config.addOns[validData.type];
		console.log("the validDate it",validData);

		if (!Object.keys(validData).length)
			return callback(new APIError( 422,'No data for create'));*/
	AssetSaleBid.create(data, function(err, res) {
		console.log("result", res);
		if (err && err.original && err.original.code === 'ER_DUP_ENTRY') {
			var e = new APIError(409, 'Duplicate Entry');
			return callback(e);
		}
		return callback(null, res);
	});
}

function fetchBid(filter, callback) {
	if (!filter) {
		return callback(new APIError(412, 'No  filter found'));
	}
	console.log("id", filter);
	var query = AssetSaleBid.find(filter);
	query.populate('userId productId')
		.exec(function(err, results) {
			if (err)
				return callback(err);
			console.log("results", results);
			return callback(null, results);
		});
}

function getBidCount(filter, callback) {
	if (!filter) {
		return callback(new APIError(412, 'No filter found'));
	}
	var query = AssetSaleBid.count(filter);
	query.exec(function(err, results) {
		if (err)
			return callback(err);
		console.log("results", results);
		return callback(null, results);
	});
}



exports.submitBid = function(req, res) {
	console.log("I an st here");
	var data = {};
	if (req.query.typeOfRequest == "submitBid") {
		data = req.body;
		//data.user = req.user;
		console.log("data to be created", data);
		if (!data || Object.keys(data).length < 1)
			return res.status(412).json({
				err: 'No data found for create'
			});
		//console.log("create", data);
		create(data, function(err, result) {
			if (err)
				return res.status(err.status || 500).send(err);
			//console.log("result", result.ticketId);

			return res.json({
				msg: 'Created Succesfully'
			});
		});
	} else if (req.query.typeOfRequest == "changeBid") {
		console.log("I am here");
		if (req.body.userId)
			data.userId = req.body.userId;
		if (req.body.productId)
			data.productId = req.body.productId;


		function updateBid(callback) {
			
			AssetSaleBid.update(data, {
				$set: {
					"offerStatus": "Bid Changed",
					"bidStatus": "Cancelled",
					"dealStatus": "Cancelled"
				}
			}, {
				multi: true
			}, function(err, result) {
				if(err)
					return callback(err);
				return callback();
			});
		}

		function newBidData(callback) {
			data = req.body;
			AssetSaleBid.create(data, function(err, result) {
				if (err)
					return callback(err);
				return callback();
			});
		}

		async.series([updateBid, newBidData], function(err, results) {
			console.log("results", results);
		});



	}
};

exports.fetchHigherBid = function(req, res) {
	console.log("I am here");
	var filter = {};
	if (req.query.productId)
		filter.productId = req.query.productId;
	if (req.query.bidAmount)
		filter.bidAmount = {
			$gt: req.query.bidAmount
		};
	AssetSaleBid.find(filter, function(err, results) {
		if (err)
			return res.status(500).send(err);
		if (results.length > 0) {
			return res.json({
				msg: true
			});
		}
		return res.json({
			msg: false
		});
	});
};

exports.withdrawBid = function(req, res) {
	var data = req.body;
	if (data._id) {
		var query = {};
		query._id = data._id;
	}
	AssetSaleBid.update(query, {
		$set: {
			offerStatus: data.offerStatus,
			bidStatus: data.bidStatus,
			dealStatus: data.dealStatus
		}
	}, function(err, results) {
		if (err)
			return res.status(500).send(err);
		return res.json({
			msg: "bid withDrawn Successfully"
		});
	});
}

exports.fetchBid = function(req, res) {
	console.log("I am hit");
	var filter = {};
	if (req.query.userId) {
		filter.userId = req.query.userId;
	}

	if (req.query.productId) {
		filter.productId = req.query.productId;
	}

	if (req.query.searchStr) {
		filter['$text'] = {
			'$search': "\"" + req.query.searchStr + "\""
		}
	}
	if (req.query.assetStatus) {
		filter.assetStatus = req.query.assetStatus;
	}
	console.log("filter", filter);
	fetchBid(filter, function(err, results) {
		if (err)
			return res.status(err.status || 500).send(err);
		console.log("I am result", results)
		return res.json(results);
	});
};

exports.searchBid = function(req, res) {
	var filter = {};

	var query = AssetSaleBid.find(filter);
	query.populate('userId productId')
		.exec(function(err, results) {
			if (err) return res.status(500).send(err);
			return res.json(results);
		});
};

exports.getBidCount = function(req, res) {
	var filter = {};
	console.log("req", req.query);
	if (req.query.productId)
		filter.productId = req.query.productId;
	if(req.query.userId)
		filter.userId=req.query.userId;
	getBidCount(filter, function(err, results) {
		if (err)
			return res.status(err.status || 500).send(err);
		return res.json(results);
	});
};