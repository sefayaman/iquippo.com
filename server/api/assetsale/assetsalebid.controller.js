'use strict';

var _ = require('lodash');
var Seq=require('seq');
var async = require('async');
var trim = require('trim');
var xlsx = require('xlsx');
var moment = require('moment');
var Utility = require('./../../components/utility.js');
var AssetSaleBid = require('./assetsalebid.model');
var AssetSaleUtil = require('./assetsaleutil');
var APIError=require('../../components/_error');
var offerStatuses=['Bid Received','Bid Changed','Bid Withdraw'];
var Product = require('../product/product.model');
var User = require('../user/user.model');
var Vendor = require('../vendor/vendor.model');
var VatModel = require('../common/vattax.model');
var MarkupPrice = require('../common/markupprice.model');
var fieldConfig = require('./fieldsConfig');

var tradeTypeStatuses = ['SELL','BOTH','NOT_AVAILABLE'];
var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling Period','Rejected','Accepted','Auto Accepted'];


exports.getEMDBasedOnUser = function(req, res) {
	var queryParam = req.query;
	var filter = {};
  	if(queryParam.categoryId)
	  filter['category.categoryId'] = queryParam.categoryId;
	AssetSaleUtil.getMasterBasedOnUser(queryParam.sellerUserId,filter,'emdmaster',function(err,result){
		if(err)
			return res.status(err.status || 500).send(err);
		
	    return res.status(200).json(result);
	});
}

exports.calculateGst = function(req,res,next){
	req.result = {};
	req.result.taxRate = 0;
	var donotCalGST = true;
	if(donotCalGST)
		return next();

	async.parallel({gst:getGST,defaultGST:getDefaultGST},function(err,result){
		if(err) return res.status(500).send(err);
		var gst = null;
		if(result.gst)
			gst = result.gst;
		else if(result.defaultGST)
			gst = result.defaultGST;
		else
			return res.status(412).send("Unable to process request.Please contact support team.");
		req.result.taxRate = (Number(req.query.bidAmount) * Number(gst.amount)) / 100;
		req.result.taxRate = Math.round(req.result.taxRate);
		return next();
	});

	function getGST(cb){
		var queryParam = req.query;
		var filter = {};
	  	if(queryParam.groupId)
		  filter.group = queryParam.groupId;
	  	if(queryParam.categoryId)
		  filter.category = queryParam.categoryId;
		if(queryParam.stateId)
		  filter.state = queryParam.stateId;
		if(queryParam.currentDate && queryParam.currentDate === 'y') {
		  filter["effectiveFromDate"] = {$lte:new Date()};
		  filter["effectiveToDate"] = {$gte:new Date()};
		}
		var query = VatModel.find(filter);
		query.exec(function(err, result) {
			if (err)
				return res.status(500).send(err);
			if(result.length)
				cb(null,result[0]);
			else
				cb(null,null);
		});
	}

	function getDefaultGST(cb){
		var filter = {};
		filter.taxType = "Default";
		var query = VatModel.find(filter);
		query.exec(function(err, otherRes) {
			if (err)
				return res.status(500).send(err);
			if(otherRes.length)
				cb(null,otherRes[0]);
			else
				cb(null,null);
		});
	}
}

exports.calculateTcs = function(req,res,next){
	if (Number(req.query.bidAmount) + Number(req.result.taxRate) > 1000000)
	    req.result.tcs = Number(req.query.bidAmount) * 0.01;
	else
		req.result.tcs = 0;
	req.result.tcs = Math.round(req.result.tcs || 0);

	return next();
}

exports.callculateParkingCharge = function(req,res,next){
	var prdId = req.query.productId;
	Product.find({_id:prdId,status:true,deleted:false},function(err,products){
		if(err) return res.status(500).send(err);
		if(!products.length)
			return res.status(412).send("Invalid product");
		var todayDate = moment().daysInMonth();
        var repoDate = moment(products[0].repoDate);
        var a = moment(repoDate, 'DD/MM/YYYY');
        var b = moment(todayDate, 'DD/MM/YYYY');
        var days = b.diff(a, 'days') + 1;
        req.result.parkingCharges = days * products[0].parkingChargePerDay || 0;
        req.result.parkingCharges = Math.round(req.result.parkingCharges);
        return next();

	})
}

exports.getBidOrBuyCalculation = function(req, res) {
	req.result.total = Math.round(req.result.taxRate + req.result.tcs + req.result.parkingCharges + parseInt(req.query.bidAmount));
	res.status(200).json(req.result);
}

// Updates an existing record in the DB.
exports.update = function(req, res,next) {

  async.eachLimit(req.bids,5,_update,function(err){
  	if(err)return handleError(res, err);
  	next();
  });

  function _update(bid,cb){ 
  	  var bidId = bid._id;
	  if(bid._id) { delete bid._id; }
	  bid.updatedAt = new Date();
	   AssetSaleBid.update({_id:bidId},{$set:bid},function(err){
	       cb(err);
	  });
  }
  
}

exports.validateUpdate = function(req,res,next){
	
	if(['approve','deliveryaccept','emdpayment'].indexOf(req.query.action) !== -1)
		async.parallel([validateBid,validateOtherBids,validateProduct],onComplete);
	else
		async.parallel([validateBid,validateProduct],onComplete);

	function onComplete(err,data){

		if(err){return res.status(err.statusCode).send(err.message);}
		req.bids = [];
		req.bids[req.bids.length] = req.body;
		if(req.query.action === 'approve'){
			getSaleProcessMaster(function(entData){
				if(!entData.coolingPeriod){
					return res.status(404).send("Cooling period configuration is not found");
				}
				if(!req.product.cooling){
					req.product.cooling = true;
					req.product.coolingStartDate = new Date();
					if(entData.coolingPeriodIn === 'Hours')
						req.product.coolingEndDate = new Date().addHours(entData.coolingPeriod ||0);
					else
						req.product.coolingEndDate = new Date().addDays(entData.coolingPeriod || 0);
					req.updateProduct = true;
				}
				if(req.bids.length)
					req.bids[0].lastAccepted = true;
				req.otherBids.forEach(function(item){
					if(item.bidStatus === bidStatuses[7]){
						item.lastAccepted = false;
						AssetSaleUtil.setStatus(item,bidStatuses[0],'bidStatus','bidStatuses',req.user._id);
						req.bids.push(item);
					}
				});
				next();
			});

		}else if(req.query.action === 'emdpayment'){
			//if(req.bid.emdPayment.remainingPayment === 0){
				getSaleProcessMaster(function(entData){
					if(!entData.fullPaymentPeriod)
						return res.status(404).send("Full payment period is not found");
					req.body.fullPaymentStartDate = new Date();
					req.body.fullPaymentEndDate = new Date().addDays(entData.fullPaymentPeriod);
					//if(req.body.fullPaymentEndDate)
					//	req.body.fullPaymentEndDate = req.body.fullPaymentEndDate.setHours(24,0,0,0);
					req.otherBids.forEach(function(item){
						item.status = false;
						AssetSaleUtil.setStatus(item,bidStatuses[2],'bidStatus','bidStatuses',req.user._id);
						AssetSaleUtil.setStatus(item,dealStatuses[5],'dealStatus','dealStatuses',req.user._id);
						req.bids.push(item);
					});
					next();
				});
			//}
			//else
			//	return res.status(412).send("EMD payment remaining");		
		}else if(req.query.action === 'fullpayment'){
			//if(req.bid.fullPayment.remainingPayment == 0)
				next();
			//else
			//	return res.status(412).send("Full payment remaining");		
		}else if(req.query.action === 'doissued'){
			req.product.assetStatus = 'sold';
			req.product.updatedAt = new Date();
			AssetSaleUtil.setStatus(req.product,'sold','assetStatus','assetStatuses',req.user._id);
			req.product.isSold = true;
			req.updateProduct = true;
			
			next();
		}else if(req.query.action === 'deliveryaccept'){
			req.product.bidReceived = false;
			req.product.bidRequestApproved = false;
			req.updateProduct = true;
			req.bids[0].status = false;
			/*req.otherBids.forEach(function(item){
				item.status = false;
				AssetSaleUtil.setStatus(item,bidStatuses[2],'bidStatus','bidStatuses',req.user._id);
				AssetSaleUtil.setStatus(item,dealStatuses[5],'dealStatus','dealStatuses',req.user._id);
				req.bids.push(item);
			});*/
			next();
		}
		else
			next();
		
	}

	function getSaleProcessMaster(cb){
		AssetSaleUtil.getMasterBasedOnUser(req.product.seller._id,{},'saleprocessmaster',function(err,entepriseData){
			if(err || !entepriseData){return res.status(404).send("Sale Process master is not found");}
			return cb(entepriseData);
		});
	}

	function validateBid(callback){
		AssetSaleBid.findById(req.params.id, function (err, bid) {
		    if (err || !bid) {return callback({statusCode:404,message:"Bid not found"});}
		    req.bid = bid;
		    return callback();
		  });		
	}

	function validateOtherBids(callback){
		var productId = "";
		if(req.body.product && req.body.product.proData)
			productId = req.body.product.proData;
		if(!productId)
			return callback({statusCode:404,message:"Bad Request"});
		AssetSaleBid.find({'product.proData':productId,status:true,_id:{$ne:req.params.id}}, function (err, bids) {
		    if (err) {return callback({statusCode:404,message:"Bid not found"});}
		    req.otherBids = bids;
		    return callback();
		  });		
	}

	function validateProduct(callback){
		var productId = "";
		if(req.body.product && req.body.product.proData)
			productId = req.body.product.proData;
		if(!productId)
			return callback({statusCode:404,message:"Bad Request"});
		Product.find({_id:productId,deleted:false,status:true},function(err,products){
		 	if (err || !products.length) { 
		 		return callback({statusCode:404,message:"It seems product is not available."});
 			}
 			req.product = products[0];
		    return callback();
		});
	}
}

exports.postUpdate = function(req,res,next){

	var postAction = req.query.action;
	if(req.updateProduct)
		updateProduct();
	else
		return res.status(200).send("Bid request updated successfully");

	function updateProduct(){
		var productId = req.product._id + "";
		delete req.product._id;
		Product.update({_id:productId},{$set:req.product},function(error,retData){
			if(error) return handleError(res,error);
			return res.status(200).send("Bid updated successfully.");
		});
	}

}

exports.validateSubmitBid = function(req,res,next){

	if(!req.body || Object.keys(req.body).length < 1)
	   return res.status(412).json({err: 'No data found for create'});
	async.parallel([validateProduct,validateOtherBids],onComplete);

	function onComplete(err){
		if(err) return res.status(err.status).send(err.msg);
		if(req.query.typeOfRequest !== "buynow")
		 return next();

		AssetSaleUtil.getMasterBasedOnUser(req.product.seller._id,{},'saleprocessmaster',function(err,saleProcessData){
			if(err || !saleProcessData){return res.status(404).send("Sale Process master is not found");}
			//return cb(entepriseData);
			if(saleProcessData.buyNowPriceApproval === 'Yes'){
				AssetSaleUtil.setStatus(req.body,bidStatuses[7],'bidStatus','bidStatuses',req.user._id);
				AssetSaleUtil.setStatus(req.body,dealStatuses[0],'dealStatus','dealStatuses',req.user._id);	
				if(!req.product.cooling){
					req.product.cooling = true;
					req.product.coolingStartDate = new Date();
					if(saleProcessData.coolingPeriodIn === 'Hours')
						req.product.coolingEndDate = new Date().addHours(saleProcessData.coolingPeriod ||0);
					else
						req.product.coolingEndDate = new Date().addDays(saleProcessData.coolingPeriod || 0);
				}
				//req.otherBids = [];
				var otherBids = req.otherBids;
				req.otherBids = [];
				otherBids.forEach(function(item){
					if(item.bidStatus === bidStatuses[7]){
						AssetSaleUtil.setStatus(item,bidStatuses[0],'bidStatus','bidStatuses',req.user._id);
						req.otherBids.push(item);
					}
				});
				return next();
			}
			AssetSaleUtil.setStatus(req.body,dealStatuses[6],'dealStatus','dealStatuses',req.user._id);
			AssetSaleUtil.setStatus(req.body,bidStatuses[7],'bidStatus','bidStatuses',req.user._id);
			req.body.emdStartDate = new Date(); 
			req.body.emdEndDate = new Date().addDays(saleProcessData.emdPeriod);
			//if(req.body.emdEndDate)
			//	req.body.emdEndDate.setHours(24,0,0,0);
			req.body.product.prevTradeType = req.product.tradeType;
			req.product.tradeType = tradeTypeStatuses[2];
			var otherBids = req.otherBids;
				req.otherBids = [];
				otherBids.forEach(function(item){
					AssetSaleUtil.setStatus(item,bidStatuses[5],'bidStatus','bidStatuses',req.user._id);
					req.otherBids.push(item);
				});

			req.autoApprove = true;
			req.buyNowApprovalValue = saleProcessData.buyNowPriceApproval;
			next();

		});

	}

	function validateProduct(callback){
		Product.findById(req.body.product.proData, function (err, product) {
			if(err) { return callback({status:500,msg:err}) }
			if(product.assetStatus === 'sold' || product.tradeType == 'NOT_AVAILABLE' || !product.status || product.deleted) {
				return callback({status:412,msg:"Product is not available for bid!"});
			}
			req.product = product;
			return callback();
  		});
	}

	function validateOtherBids(callback){

		var filter = {};
		if (req.body.user && req.query.typeOfRequest !== "buynow")
			filter.user = req.body.user;
		if(req.body.product && req.body.product.proData)
			filter['product.proData'] = req.body.product.proData;
		filter.offerStatus = offerStatuses[0];
		filter.bidStatus = {$in : [bidStatuses[0]]};
		if(req.query.typeOfRequest === "buynow")
			filter.bidStatus.$in.push(bidStatuses[7]);
		filter.dealStatus = dealStatuses[0];
		AssetSaleBid.find(filter).exec(function(err, bids){
			if(err)
				return callback({status:500,msg:err});
			req.otherBids = bids;
			var buynowCount = 0;
			if(req.query.typeOfRequest === "buynow"){
				req.otherBids.forEach(function(bid){
					if(bid.offerType === 'Buynow')
						buynowCount++;
				});
				req.buynowCount = buynowCount;
				return callback();
			}

			req.otherBids.forEach(function(bid){
				if(req.query.typeOfRequest == "changeBid"){
					AssetSaleUtil.setStatus(bid,offerStatuses[1],'offerStatus','offerStatuses',req.user._id);
					bid.bidChanged = true;
					bid.status = false;
				}
				AssetSaleUtil.setStatus(bid,bidStatuses[1],'bidStatus','bidStatuses',req.user._id);
			 	AssetSaleUtil.setStatus(bid,dealStatuses[2],'dealStatus','dealStatuses',req.user._id);
			});
			return callback();
		});
	}

}

exports.submitBid = function(req, res) {
	
	async.series([newBidData,updateBidAndProduct],function(err){
		if(err) return res.status(500).send(err);
		var msg = ""
		if(req.query.typeOfRequest === "buynow" && req.buyNowApprovalValue === 'No' && req.buynowCount === 0)
			msg = "Your Sale process is in process , you may contact us at 03366022059";
		else if(req.query.typeOfRequest === "buynow" && req.buyNowApprovalValue == 'No' && req.buynowCount > 0)	
			msg = "Someone else has already submitted the before you , in case of his cancellation you will be getting the same , You may Contact us at 03366022059";
		else
			msg = "Your Request has been submitted successfully , We will get in touch with You.";

		return res.status(200).json({message:msg});
		//return res.status(200).send("Bid submitted successfully.");
	});

	function updateBidAndProduct(callback){
		async.eachLimit(req.otherBids,5,updateBid,function(err){
			var filter = {};
			filter.dealStatus = {$in:[dealStatuses[0],dealStatuses[6]]};
			filter.status = true;
			filter['product.proData'] = req.product._id;
			AssetSaleBid.find(filter,function(err,resList){
				if(err) return callback(err);
				/*if(!resList.length)
					return callback();*/

				req.product.bidCount = resList.length;
				req.product.bidReceived = true;
				req.product.bidRequestApproved = req.autoApprove?true:false;
				var highestBid = 0;
				if(resList.length)
					highestBid = resList[0].bidAmount;
				resList.forEach(function(item){
					if(item.bidAmount > highestBid)
						highestBid = item.bidAmount;
				});
				req.product.highestBid = highestBid;
				var prdId = req.product._id;
				delete req.product._id;
				Product.update({_id:prdId},{$set:req.product}).exec(function(err){
					console.log("err",err);
				});
				return callback();
			});
		});
	}

	function updateBid(bid,cb){
		var bidId = bid._id;
		delete bid._id;
		AssetSaleBid.update({_id:bidId},{$set:bid},function(err){
			if(err) console.log("Error in prevoius bid update",err);
			return cb();
		});
	}

	function newBidData(callback) {
		var data = req.body;
		AssetSaleBid.create(data, function(err, result) {
			if (err)
				return callback(err);
			return callback();
		});
	}
};

exports.withdrawBid = function(req, res) {

	var withdrawBid = async.seq(getBid,updateBid,updateCountAndBidAmount);
	
	withdrawBid(function(err,result){
		if(err) return res.status(err.status).send(err.msg);
		return res.json({msg: "Bid withdraw Successfully!"});
	});

	function getBid(callback){
		var filter={};
		var statusObj = {};
		var bidData = {};
		if(req.body.userId)
			filter.user = req.body.userId;
		if(req.body.productId)
			filter['product.proData'] = req.body.productId;
		if(req.body._id)
			filter._id = req.body._id;
		filter.dealStatus = dealStatuses[0];
		filter.offerStatus = offerStatuses[0];
		filter.bidStatus = bidStatuses[0];
		AssetSaleBid.find(filter).exec(function(err, bid){
			if(err) callback({status:500,msg:err});
			if(bid.length == 0)
				return callback({status:404,msg: "No active bid for this product for withdraw!"})
			if (bid.length > 0)
				bidData = bid[0].toObject();
			callback(null, bidData);
			
		});
	}

	function updateBid(bidData,callback){

		AssetSaleUtil.setStatus(bidData,bidStatuses[1],'bidStatus','bidStatuses',req.user._id);
	 	AssetSaleUtil.setStatus(bidData,dealStatuses[2],'dealStatus','dealStatuses',req.user._id);
	 	AssetSaleUtil.setStatus(bidData,offerStatuses[2],'offerStatus','offerStatuses',req.user._id);
	 	bidData.status = false;
		var bidId = bidData._id;
		delete bidData._id;
		AssetSaleBid.update({_id : bidId}, {
			$set: bidData}, function(err, result) {
			if (err) return callback({status:500,msg:err});
			return callback(null,bidData);
		});
	}

	function updateCountAndBidAmount(bidData,callback){
		var filter = {};
		filter.dealStatus = dealStatuses[0];
		filter.status = true;
		filter['product.proData'] = bidData.product.proData;
		AssetSaleBid.find(filter,function(err,resList){
			if(err) return callback({status:500,msg:err});
			var updatedData = {};
			updatedData.bidCount = resList.length;
			var highestBid = 0;
			if(resList.length)
				highestBid = resList[0].bidAmount;
			resList.forEach(function(item){
				if(item.bidAmount > highestBid)
					highestBid = item.bidAmount;
			});
			updatedData.highestBid = highestBid;
			var proId = bidData.product.proData;
			if(updatedData.bidCount === 0)
				updatedData.bidReceived = false;
			Product.update({_id:proId},{$set:updatedData}).exec();
			return callback(null);
		});
	}	
};

exports.fetchBid = function(req,res){
	var filter={};
	filter.bidChanged = false;
	if(req.query.userId)
		filter.user = req.query.userId;
	
	if(req.query.actionable === 'y')
		filter.status = true;
	
	if(req.query.actionable === 'n')
		filter.status = false;

	if(req.query.productId)
		filter['product.proData'] = req.query.productId;
	
	if(req.query.offerStatus)
		filter.offerStatus = req.query.offerStatus;

	if(req.query.dealStatus)
		filter.dealStatus = req.query.dealStatus;
	
	if(req.query.bidStatus)
		filter.bidStatus = req.query.bidStatus;
	
	if (req.query.searchStr) {
    	filter['$text'] = {
        	'$search': "\""+req.query.searchStr+"\""
     	}
    }
  	if(req.query.assetStatus)
  		filter.assetStatus = req.query.assetStatus;
  	if(req.query.userid)
  		filter['product.seller._id'] = req.query.userid +"";
  	if(req.sellers && req.sellers.length)
  		filter['product.seller._id'] = {$in:req.sellers};
  	if (req.query.pagination) {
		paginatedResult(req, res, AssetSaleBid, filter);
		return;
	}
	fetchBid(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	return res.json(results);
    });
};

function fetchBid(filter, callback) {

	var query = AssetSaleBid.find(filter);
	query.populate('user product.proData')
		.exec(function(err, results) {
			if (err)
				return callback(err);
			return callback(null, results);
		});
}

function paginatedResult(req, res, modelRef, filter) {
  	
  	var bodyData = req.query;

	var pageSize = bodyData.itemsPerPage || 50;
	var first_id = bodyData.first_id;
	var last_id = bodyData.last_id;
	var currentPage = bodyData.currentPage || 1;
	var prevPage = bodyData.prevPage || 0;
	var isNext = currentPage - prevPage >= 0 ? true : false;
	
	async.parallel({count:_count,result:_getResult},function(err,resObj){
		if(err) return handleError(res,err);
		return res.status(200).json({totalItems:resObj.count,items:resObj.result});
	});
	
	function _count(cb){
		modelRef.count(filter, function(err, counts) {
			cb(err,counts);
		});
	}

	function _getResult(cb){

		var sortFilter = {
				_id: -1
			};
			if (last_id && isNext) {
				filter['_id'] = {
					'$lt': last_id
				};
			}
			if (first_id && !isNext) {
				filter['_id'] = {
					'$gt': first_id
				};
				sortFilter['_id'] = 1;
			}

			var query = null;
			var skipNumber = currentPage - prevPage;
			if (skipNumber < 0)
				skipNumber = -1 * skipNumber;

			query = modelRef.find(filter).sort(sortFilter).limit(pageSize * skipNumber);
			query.populate('user product.proData')
			.exec(function(err, items) {
				if (!err && items.length > pageSize * (skipNumber - 1)) {
					items = items.slice(pageSize * (skipNumber - 1), items.length);
				} else
					items = [];
				if (!isNext && result.items.length > 0)
					items.reverse();
				cb(err,items);
			});
	}

}

exports.getBidCount = function(req, res) {

	async.parallel({pCount:_getCountOnProduct,uCount:_getCountOnUser},function(err,resObj){
		if(err) return handleError(res,err);
		return res.status(200).json({totalBidCount:resObj.pCount,userBidCount:resObj.uCount});
	});

	function _getCountOnProduct(callback){
		var filter = {status:true};
		if (req.query.productId)
			filter['product.proData'] = req.query.productId;
		var query = AssetSaleBid.count(filter);
		query.exec(function(err, results) {
			return callback(err, results);
		});
	}

	function _getCountOnUser(callback){
		var filter = {status:true};
		if (req.query.productId)
			filter['product.proData'] = req.query.productId;
		if (req.query.userId)
			filter.user = req.query.userId;
		var query = AssetSaleBid.count(filter);
		query.exec(function(err, results) {
			return callback(err, results);
		});
	}

};

exports.getMaxBidOnProduct = function(req, res) {
	var filter = {};
	if(req.query.assetId)
		filter['product.assetId'] = req.query.assetId;
	if(req.query.userId)
		filter.user = req.query.userId;
	filter.offerStatus = offerStatuses[0];
	var query = AssetSaleBid.find(filter).sort({bidAmount:-1}).limit(1);
	query.exec(function(err,results){
		if(err)
			return res.status(500).send(err);
		return res.status(201).json(results[0]);
	});
};

exports.getSellers = function(req,res,next){
	
	var userType = req.body.userType || req.query.userType;
	var partnerId = req.body.partnerId || req.query.partnerId;
	var defaultPartner = req.body.defaultPartner || req.query.defaultPartner;
	var enterpriseId = req.body.enterpriseId || req.query.enterpriseId;
	if(enterpriseId)
		return getEnteriseUser();
	
	if(!userType || userType !== 'FA')
		return next();
	var users = [];
	async.parallel([getUsersAssociatedToEnterprise,getCustomer],function(err,result){
  	if(err){console.log("error", err);}
  	req.sellers = users;
  	return next();
  });

	function getEnteriseUser(){
	  req.sellers = [];
	  User.find({enterpriseId:enterpriseId,deleted:false,status:true},function(err,sellers){
	    if(err || !sellers.length){
	      return next();
	    }
	    sellers.forEach(function(item){
	      req.sellers.push(item._id + "")
	    });
	    next();
	  })
	}

  function getUsersAssociatedToEnterprise(callback){
    var filter = {};
    filter.deleted = false;
    filter.status = true;
    filter.enterprise = true;
    filter.role = "enterprise";
    filter.$or = [{FAPartnerId : partnerId}];
    if(defaultPartner === 'y')
      filter.$or[filter.$or.length] = {FAPartnerId : {$exists:false}};
  	User.find(filter,function(err,enterprises){
      if(err){return callback("Error in getting user")};
      var entIds = [];
      if(!enterprises.length)
        return callback();

      enterprises.forEach(function(item){
        entIds.push(item.enterpriseId);
      });
      User.find({enterpriseId:{$in:entIds},deleted:false,status:true},function(error,finalUsers){
        if(err){return callback("Error in getting user")};
        finalUsers.forEach(function(user){
          users.push(user._id + "");
        })
        return callback();  
      })
    });
  }

  function getCustomer(callback){
     var filter = {};
    filter.deleted = false;
    filter.status = true;
    filter.$or = [{FAPartnerId : partnerId}];
    filter.role = {$in: ['customer', 'channelpartner']};
    if(defaultPartner === 'y')
      filter.$or[filter.$or.length] = {FAPartnerId : {$exists:false}};
    User.find(filter,function(err,finalUsers){
      if(err){return callback("Error in getting user")};
      finalUsers.forEach(function(item){
      	users.push(item._id + "");
      });
      return callback();
    });

  }
}

exports.getBidProduct = function(req,res,next){
  	
  	if(req.body.userType === 'FA'){
  		if(!req.sellers.length)
  			return res.status(200).json({totalItems:0,products:[]});
  		req.bidRequestApproved = true;
  	}
	req.body.bidReceived = true;
	req.body.pagination = true;
  	next();
}

exports.exportExcel = function(req,res){
	var filter = {};
	var user = req.user;
	var queryParam = req.query;
	var fieldsMap = {};
	filter.bidChanged = false;
	
	if(req.query.actionable === 'y')
		filter.status = true;
	
	if(req.query.actionable === 'n')
		filter.status = false;

	if(queryParam.seller == 'y'){
		filter['product.seller._id'] = req.user._id +"";
		fieldsMap = fieldConfig['SELLER_FIELDS'];
	}

	if(queryParam.buyer == 'y'){
		filter.user = req.user._id +"";
		fieldsMap = fieldConfig['BUYER_FIELDS'];
	}

	if(queryParam.fa == 'y'){
		filter['product.seller._id'] = {$in:req.sellers || []};
		fieldsMap = fieldConfig['FA_FIELDS'];
	};

	if(user.role == 'admin')
  		fieldsMap = fieldConfig['ADMIN_FIELDS'];
  	if(user.role == 'admin' && queryParam.payment === 'y') {
  		fieldsMap = fieldConfig['EXPORT_PAYMENT'];
  	}
  	if(queryParam.productIds)
		filter['product.proData'] = {$in:queryParam.productIds.split(',') || []};
	
	if(queryParam.offerStatus)
		filter.offerStatus = queryParam.offerStatus;

	if(queryParam.dealStatuses)
		filter.dealStatus = {$in:queryParam.dealStatuses.split(',')};
	
	if(queryParam.bidStatus)
		filter.bidStatus = queryParam.bidStatus;
	if(req.sellers && req.sellers.length)
  		filter['product.seller._id'] = {$in:req.sellers || []};
	 	
  	var query = AssetSaleBid.find(filter).populate('user product.proData');
	query.exec(function(err,resList){
		if(err) return handleError(res,err);
		if(queryParam.payment === 'y' && resList) {
			var jsonArr = [];
	        resList.forEach(function(item,index){
	            if(item.emdPayment && item.emdPayment.paymentsDetail){
	              item.emdPayment.paymentsDetail.forEach(function(innerItem){
	                _formatPayments(item,innerItem,jsonArr);
	              });
	            }
	            if(item.fullPayment && item.fullPayment.paymentsDetail){
	              item.fullPayment.paymentsDetail.forEach(function(innerItem){
	                _formatPayments(item,innerItem,jsonArr);
	              });
	            }
	        });
	        resList = [];
	        if(jsonArr.length > 0)
	        	resList = jsonArr.slice();
	        	//resList = JSON.parse(JSON.stringify(jsonArr));
	    }

		renderExcel(resList);
	});

	function renderExcel(resList){
	  var dataArr = [];
	  var headers = Object.keys(fieldsMap);
	  dataArr.push(headers);
	  resList.forEach(function(item,idx){
	    dataArr[idx + 1] = [];
	    headers.forEach(function(header){
	      var keyObj = fieldsMap[header];
	      var val = _.get(item,keyObj.key,"");
	      if(keyObj.type && keyObj.type == 'boolean')
	          val = val?'YES':'NO';
	      if(keyObj.type && keyObj.type == 'date' && val)
	        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
	      if(keyObj.key && keyObj.key == 'buyerName' && item.user)
	        val = item.user.fname + " " + item.user.lname;
	      if(keyObj.key && keyObj.key == 'fullPaymentAmount')
	        val = item.fullPaymentAmount;

	      if(keyObj.type && keyObj.type == 'url' && val){
	        if(val.filename)
	            val =  req.protocol + "://" + req.headers.host + "/download/"+ item.assetDir + "/" + val.filename || "";
	        else
	          val = "";
	      }
	       dataArr[idx + 1].push(val);
	    });
	  });

	  var ws = Utility.excel_from_data(dataArr,headers);
	  var ws_name = "bids_" + new Date().getTime();
	  var wb = Utility.getWorkbook();
	  wb.SheetNames.push(ws_name);
	  wb.Sheets[ws_name] = ws;
	  var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
	  res.end(wbout);
	}

}

function _formatPayments(item,innerItem,jsonArr){
    var obj = {};
    obj['ticketId'] = item.ticketId || "";
    obj['assetId'] = item.product.assetId || "";
    obj['assetName'] = item.product.name || "";
    obj['buyerName'] = item.user.fname + " " + item.user.lname || "";
    obj['buyerMobile'] = item.user.mobile|| "" ;
    obj['buyerEmail'] = item.user.email || "" ;
    obj['paymentMode'] = innerItem.paymentMode || "";
    obj['bankName'] = innerItem.bankName || "";
    obj['instrumentNo'] = innerItem.instrumentNo || "";
    obj['amount'] = innerItem.amount || 0;
    obj['paymentDate'] = innerItem.paymentDate || "";
    obj['createdAt'] = innerItem.createdAt || ""
    jsonArr.push(obj);
  }

function handleError(res, err) {
	return res.status(500).send(err);
}