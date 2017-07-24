'use strict';

var _ = require('lodash');
var Seq=require('seq');
var async = require('async');
var trim = require('trim');
var AssetSaleBid = require('./assetsalebid.model');
var AssetSaleUtil = require('./assetsaleutil');
var APIError=require('../../components/_error');
var offerStatuses=['Bid Received','Bid Changed','Bid Withdrawn'];
var Product = require('../product/product.model');
var User = require('../user/user.model');
var Vendor = require('../vendor/vendor.model');
var VatModel = require('../common/vattax.model');
var MarkupPrice = require('../common/markupprice.model');

//var dealStatuses=['Decision Pending','Approved','EMD Received','Rejected-EMD Failed','Full Payment Received','Rejected-Full Sale Value Not Realized','DO Issued','Asset Delivered','Acceptance of Delivery','Offer Rejected','Closed','Bid-Rejected','Cancelled'];
//var bidStatuses=['In Progress','Accepted','Auto Accepted','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling','Rejected','Cancelled'];

var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling','Rejected','Accepted','Auto Accepted'];

exports.getBidOrBuyCalculation = function(req, res) {
	var queryParam = req.query;
	var filter = {};
  	var resultObj = {};
  	resultObj.taxRate = 0;
  	resultObj.tcs = 0;
  	if(queryParam.categoryId)
	  filter.category = queryParam.categoryId;
	if(queryParam.stateId)
	  filter.state = queryParam.stateId;
	if(queryParam.currentDate && queryParam.currentDate === 'y') {
	  filter["effectiveFromDate"] = {$lte:new Date()};
	  filter["effectiveToDate"] = {$gte:new Date()};
	}
  	
	getGST(filter,function(err,gstax){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	var taxPercent = 0;
    	if(gstax && gstax.length)
    		taxPercent = gstax[0].amount;
    	if(queryParam.buyNowFlag) {
	    	resultObj.taxRate = (Number(queryParam.bidAmount) * Number(taxPercent)) / 100;
	    	if (Number(queryParam.bidAmount) + Number(resultObj.taxRate) > 1000000)
		       resultObj.tcs = Number(queryParam.bidAmount) * 0.01;

		    return res.status(200).json(resultObj);
		} else {
			// filter = {};
			// filter.status = true;
			// filter.deleted = false;
			// filter._id = queryParam.sellerUserId;
			//getMarkupPercentOnUser(filter,function(err,result){
				AssetSaleUtil.getMasterBasedOnUser(queryParam.sellerUserId,{},'markup',function(err,result){
				if(err)
    				return res.status(err.status || 500).send(err);
    			var markupPercent = 0;
    			if(result && result.length)
		    		markupPercent = result[0].price;
		    	resultObj.buyNowPrice = Number(queryParam.bidAmount) + (Number(queryParam.bidAmount) * Number(markupPercent) / 100);
    			resultObj.taxRate = (Number(resultObj.buyNowPrice) * Number(taxPercent)) / 100;
			    if (Number(queryParam.bidAmount) + Number(resultObj.taxRate) > 1000000) {
			       resultObj.tcs = Number(resultObj.buyNowPrice) * 0.01;
			    }
			    return res.status(200).json(resultObj);
			});
		}
	    
    });
}

function getGST(filter, callback) {
	var query = VatModel.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		return callback(null, result);
	});
}

/*function getMarkupPrice(filter, callback) {
	var query = MarkupPrice.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			filter = {};
			filter.userRole = "Other";
			var query = MarkupPrice.find(filter);
			query.exec(function(err, markupPrice) {
				if (err)
					return callback(err);
				return callback(null, markupPrice);
			});
		} else {
			return callback(null, result);
		}
	});
}

function getMarkupPercentOnUser(filter, callback) {
	User.findById(filter).exec(function(err, user){
	    if (err)
			return callback(err);
	  	var markupFilter = {};
	    switch (user.role) {
	    	case "enterprise" : 
	    			markupFilter = {};
	    			markupFilter.enterpriseId = user.enterpriseId;
	    			break;
	    	case "channelpartner" : 
	    			markupFilter = {};
	    			markupFilter['user.userId'] = user._id;
	    			break;
	    	case "customer" : 
	    			markupFilter = {};
	    			if(user.createdBy && user.createdBy.role === 'channelpartner')
	    				markupFilter['user.userId'] = user.createdBy._id;
	    			else 
	    				markupFilter['user.userId'] = user._id;
	    			break;
	    }
	    getMarkupPrice(markupFilter,function(err, markupPer){
			if(err)
				console.log(err);
			return callback(null, markupPer);
		});
	});
}*/

function create(data,callback){
	if (!data)
			return callback(new APIError( 412,'No data for creation'));
        
		AssetSaleBid.create(data,function(err,res){
			if (err && err.original && err.original.code === 'ER_DUP_ENTRY') {
				var e = new APIError(409,'Duplicate Entry');
			return callback(e);
		}
			return callback(null, res);
		});
}

// Updates an existing record in the DB.
exports.update = function(req, res,next) {
  
  var bodyData = req.body;
  console.log("req.body", bodyData);
  if(bodyData._id) { delete bodyData._id; }
  bodyData.updatedAt = new Date();
   AssetSaleBid.update({_id:req.params.id},{$set:bodyData},function(err){
        if (err) { return handleError(res, err); }
        return next();
  });
}

exports.validateUpdate = function(req,res,next){

	async.parallel([validateBid,validateProduct],onComplete);
	function onComplete(err,data){
		if(err){return res.status(err.statusCode).send(err.message);}
		next();
	}

	function validateBid(callback){
		AssetSaleBid.findById(req.params.id, function (err, bid) {
		    if (err || !bid) {return callback({statusCode:404,message:"Bid not found"});}
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
	if(postAction === 'approve' && !req.product.cooling)
		activateCoolingPeriod();
	else
		return res.status(200).send("Bid request updated successfully");


	//Activate cooling peroid
	function activateCoolingPeriod(){
		AssetSaleUtil.getMasterBasedOnUser(req.product.seller._id,{},'enterprisemaster',function(err,entepriseData){
			console.log("cooling",entepriseData);
			if(err || !entepriseData.coolingPeriod){return res.status(404).send("Cooling period configuration is not found");}
			var coolingObj = {cooling:true};
			coolingObj.coolingStartDate = new Date();
			coolingObj.coolingEndDate = new Date().addDays(entepriseData.coolingPeriod);
			Product.update({_id:req.product._id + ""},{$set:coolingObj},function(error,retData){
				if(err) return handleError(res,error);
				return res.status(200).send("Bid updated successfully.");
			})
		});
	}

}

function fetchBid(filter, callback) {
	if (!filter) {
		return callback(new APIError(412, 'No  filter found'));
	}
	var query = AssetSaleBid.find(filter);
	query.populate('user product.proData')
		.exec(function(err, results) {
			if (err)
				return callback(err);
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
		return callback(null, results);
	});
}

exports.submitBid = function(req, res) {
	var data = {};
	var bidReceived = false;
	var bidResult = {};
	var previousBid = {};
	if(req.body.bidReceived)
		bidReceived = req.body.bidReceived;
	delete req.body.bidReceived;
	Product.findById(req.body.product.proData, function (err, product) {
    	if(err) { return res.status(err.status || 500).send(err); }
    	if(product.assetStatus === 'sold' || product.tradeType == 'NOT_AVAILABLE' || !product.status || product.deleted) {
    		return res.status(412).json({err: 'No data found for create'});
    	}
		if (req.query.typeOfRequest == "submitBid" || req.query.typeOfRequest == "buynow") {
			data = req.body;
			if (!data || Object.keys(data).length < 1)
				return res.status(412).json({
					err: 'No data found for create'
				});
			create(data, function(err, result) {
				if (err)
					return res.status(err.status || 500).send(err);
				if(!bidReceived)
					updateBidReqFlagInProduct(result)

				return res.status(201).json(result);
			});
		} else if (req.query.typeOfRequest == "changeBid") {
			async.series([updateBid, newBidData], function(err, results) {
				if(!bidReceived)
					updateBidReqFlagInProduct(bidResult);
				return res.status(201).json(bidResult);
			});
		}
	});
	function updateBid(callback) {
		var statusObj = {};
		var filter = {};
		if (req.body.user)
			filter.user = req.body.user;
		if(req.body.product && req.body.product.proData)
			filter['product.proData'] = req.body.product.proData;
		filter.offerStatus = offerStatuses[0];
		AssetSaleBid.find(filter).exec(function(err, bid){
			if(err)
				console.log(err);
			if (bid.length > 0)
				previousBid = bid[0].toObject();
			previousBid.statusObj = {};
			statusObj.offerStatus = offerStatuses[1];
			statusObj.bidStatus = bidStatuses[1];
			statusObj.dealStatus = dealStatuses[2];
			previousBid.statusObj = statusObj;
			var dataObj =  callStatusUpdates(previousBid);
				AssetSaleBid.update({_id : previousBid._id}, {
					$set: dataObj}, function(err, result) {
					if (err)
						return callback(err);
					return callback();
				});
		});
	}

	function newBidData(callback) {
		data = req.body;
		AssetSaleBid.create(data, function(err, result) {
			if (err)
				return callback(err);
			bidResult = result.toObject();
			return callback(bidResult);
		});
	}
};

function callStatusUpdates(preBidData) {
	var dataObj = {}
	dataObj.offerStatus = preBidData.statusObj.offerStatus;
	dataObj.bidStatus = preBidData.statusObj.bidStatus;
	dataObj.dealStatus = preBidData.statusObj.dealStatus;
	dataObj.offerStatuses = preBidData.offerStatuses;
    dataObj.dealStatuses = preBidData.dealStatuses;
    dataObj.bidStatuses = preBidData.bidStatuses;
    
    var offerStatusObj = {};
    offerStatusObj.userId = preBidData.user;
    offerStatusObj.status = preBidData.statusObj.offerStatus;
    offerStatusObj.createdAt = new Date();
    dataObj.offerStatuses[dataObj.offerStatuses.length] = offerStatusObj;

    var bidStatusObj = {};
    bidStatusObj.userId = preBidData.user;
    bidStatusObj.status = preBidData.statusObj.bidStatus;
    bidStatusObj.createdAt = new Date();
    dataObj.bidStatuses[dataObj.bidStatuses.length] = bidStatusObj;

    var dealStatusObj = {};
    dealStatusObj.userId = preBidData.user;
    dealStatusObj.status = preBidData.statusObj.dealStatus;
    dealStatusObj.createdAt = new Date();
    dataObj.dealStatuses[dataObj.dealStatuses.length] = dealStatusObj;

    return dataObj;
}

function updateBidReqFlagInProduct(data) {
	var filter = {};
	filter.assetId = data.product.assetId;
	filter.status = true;
	filter.deleted = false;
	Product.update(filter, {$set:{"bidReceived":true}},function(err,result){
        if(err){console.log(err)};
    });  
}

exports.withdrawBid = function(req, res) {
	var filter={};
	var statusObj = {};
	var bidData = {};
	if(req.body.userId)
		filter.user = req.body.userId;
	if(req.body.productId)
		filter['product.proData'] = req.body.productId;
	if(req.body._id)
		filter._id = req.body._id;
	filter.offerStatus = offerStatuses[0];
	AssetSaleBid.find(filter).exec(function(err, bid){
		if(err)
			console.log(err);
		if (bid.length > 0)
			bidData = bid[0].toObject();
		bidData.statusObj = {};
		statusObj.offerStatus = offerStatuses[2];
		statusObj.bidStatus = bidStatuses[1];
		statusObj.dealStatus = dealStatuses[2];
		bidData.statusObj = statusObj;
		var dataObj =  callStatusUpdates(bidData);
		AssetSaleBid.update({_id : bidData._id}, {
			$set: dataObj}, function(err, result) {
			if (err)
				return res.status(500).send(err);
			return res.json({
				msg: "Bid withdrawn Successfully!"
			});
		});
	});	
};

exports.fetchBid = function(req,res){
	var filter={};
	if(req.query.userId)
		filter.user = req.query.userId;

	if(req.query.productId)
		filter['product.proData'] = req.query.productId;
	
	if(req.query.offerStatus)
		filter.offerStatus = req.query.offerStatus;

	if(req.query.bidStatus)
		filter.bidStatus = req.query.bidStatus;
	
	if (req.query.searchStr) {
    	filter['$text'] = {
        	'$search': "\""+req.query.searchStr+"\""
     	}
    }
  	if(req.query.assetStatus)
  		filter.assetStatus=req.query.assetStatus;

  if (req.query.pagination) {
		paginatedResult(req, res, AssetSaleBid, filter, {});
		return;
	}

    fetchBid(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	return res.json(results);
    });
};

exports.searchBid = function(req,res){
	 var filter={};
	
  var query=AssetSaleBid.find(filter);
  query.populate('user product.proData')
  .exec(function(err,results){
  	if(err) return res.status(500).send(err);
   return res.json(results);
  });
};

exports.getBidCount = function(req, res) {
	var filter = {};
	if (req.query.productId)
		filter['product.proData'] = req.query.productId;
	if (req.query.userId)
		filter.user = req.query.userId;
	getBidCount(filter, function(err, results) {
		if (err)
			return res.status(err.status || 500).send(err);
		return res.json(results);
	});
};

exports.getMaxBidOnProduct = function(req, res) {
	var filter = {};
	if(req.query.assetId)
		filter['product.assetId'] = req.query.assetId;
	filter.offerStatus = offerStatuses[0];
	var query = AssetSaleBid.find(filter).sort({bidAmount:-1}).limit(1);
	query.exec(function(err,results){
		if(err)
			return res.status(500).send(err);
		return res.status(201).json(results[0]);
	});
};

function paginatedResult(req, res, modelRef, filter, result) {
  	var bodyData={};
	if(req.method === 'GET') 
	{bodyData=req.query;}
     else{
     	bodyData=req.body;
     }
	var pageSize = bodyData.itemsPerPage || 50;
	var first_id = bodyData.first_id;
	var last_id = bodyData.last_id;
	var currentPage = bodyData.currentPage || 1;
	var prevPage = bodyData.prevPage || 0;
	var isNext = currentPage - prevPage >= 0 ? true : false;
	Seq()
		.seq(function() {
			var self = this;
			modelRef.count(filter, function(err, counts) {
				result.totalItems = counts;
				self(err);
			})
		})
		.seq(function() {

			var self = this;
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
			query.populate('userId productId')
				.exec(function(err, items) {
					if (!err && items.length > pageSize * (skipNumber - 1)) {
						result.items = items.slice(pageSize * (skipNumber - 1), items.length);
					} else
						result.items = [];
					if (!isNext && result.items.length > 0)
						result.items.reverse();
					self(err);
				});

		})
		.seq(function() {
			return res.status(200).json(result);
		})
		.catch(function(err) {
			console.log("error", err);
			//handleError(res, err);
		})

}

exports.getBidProduct = function(req,res,next){
  
  var bodyData = req.body;
  req.body.bidReceived = true;
  req.body.pagination = true;

  if(!bodyData.userType || bodyData.userType !== 'FA')
  	return next();

  var users = [];
  async.parallel([getUsersAssociatedToEnterprise,getUsersAssociatedToChannelPartner,getCustomer],function(err,result){
  	if(err){console.log("error", err);}
  	if(!users.length)
  		return res.status(200).json({totalItems:0,products:[]});
  	req.sellers = users;
  	return next();
  });

  function getUsersAssociatedToEnterprise(callback){
    var filter = {};
    filter.deleted = false;
    filter.status = true;
    filter.enterprise = true;
    filter.$or = [{"availedServices.partnerId" : bodyData.partnerId}];
    if(bodyData.default === 'y')
      filter.$or[filter.$or.length] = {"availedServices.code" : {$ne:"Sale Fulfilment"}};
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

  function getUsersAssociatedToChannelPartner(callback){
    var filter = {};
    filter.deleted = false;
    filter.status = true;
    filter.role = "channelpartner";
    filter.$or = [{FAPartnerId : bodyData.partnerId}];
    if(bodyData.default === 'y')
      filter.$or[filter.$or.length] = {FAPartnerId : {$exist:false}};
    User.find(filter,function(err,chUsers){
      if(err){return callback("Error in getting user")};
      var chIds = [];
      if(!chUsers.length)
        return callback();
      chUsers.forEach(function(item){
        chIds.push(item._id);
        users.push(item._id + "");
      });
      User.find({'createdBy._id':{$in:chIds},deleted:false,status:true},function(error,finalUsers){
        if(err){return callback("Error in getting user")};
        finalUsers.forEach(function(user){
          users.push(user._id + "");
        });
        return callback();  
      })
    });
  }

  function getCustomer(callback){
     var filter = {};
    filter.deleted = false;
    filter.status = true;
    filter.$or = [{FAPartnerId : bodyData.partnerId}];
    filter.role = {$ne:"channelpartner"};
    if(bodyData.default === 'y')
      filter.$or[filter.$or.length] = {FAPartnerId : {$exist:false}};
    User.find(filter,function(err,finalUsers){
      if(err){return callback("Error in getting user")};
      finalUsers.forEach(function(item){
        users.push(item._id + "");
      });
      return callback();
    });

  }
}

function handleError(res, err) {
  return res.status(500).send(err);
}