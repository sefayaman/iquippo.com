'use strict';

var _ = require('lodash');
var Seq=require('seq');
var async = require('async');
var trim = require('trim');
var AssetSaleBid = require('./assetsalebid.model');
var APIError=require('../../components/_error');
var offerStatuses=['Bid Received','Bid Changed','Bid Withdrawn'];
var Product = require('../product/product.model');
var User = require('../user/user.model');
var Vendor = require('../vendor/vendor.model');

function create(data,callback){
	if (!data)
			return callback(new APIError( 412,'No data for creation'));

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
        
		AssetSaleBid.create(data,function(err,res){
			console.log("result",res);
			if (err && err.original && err.original.code === 'ER_DUP_ENTRY') {
				var e = new APIError(409,'Duplicate Entry');
			return callback(e);
		}
		console.log("result",res);
			return callback(null, res);
		});
}

function fetchBid(filter, callback) {
	if (!filter) {
		return callback(new APIError(412, 'No  filter found'));
	}
	console.log("id", filter);
	var query = AssetSaleBid.find(filter);
	query.populate('user product.proData')
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
			data.user = req.body.userId;
		if (req.body.productId)
			data.product.proData = req.body.productId;


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
				if (err)
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

exports.fetchBid=function(req,res){
	var filter={};
	if(req.query.userId){
		filter.user = req.query.userId;
	}

	if(req.query.productId){
		filter['product.proData'] = req.query.productId;
	}
	
	 if (req.query.searchStr) {
       filter['$text'] = {
        '$search': "\""+req.query.searchStr+"\""
      }
  }
  if(req.query.assetStatus){
  	filter.assetStatus=req.query.assetStatus;
  }
  console.log("filter out",filter);
console.log("req.query",req.query);
  if (req.query.pagination) {
		paginatedResult(req, res, AssetSaleBid, filter, {});
		return;
	}

    fetchBid(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	//console.log("I am result",results)
        return res.json(results);
    });
};

exports.searchBid=function(req,res){
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
	console.log("req", req.query);
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
	console.log("results", filter);
	var query = AssetSaleBid.find(filter).sort({bidAmount:-1}).limit(1);
	query.exec(function(err,results){
		if(err)
			return res.status(500).send(err);
		return res.status(201).json(results[0]);
	});
};

function fetchData(filter,callback){
    var finalarray = [];
    var enterpriseuserarray= [];
    var enterprise =[];
    console.log("user filter", filter);
	var query = Vendor.find({"user.mobile":filter.mobile},function(err,result){
	if(err){
            return callback(err);
	}else{
		var partnerid =result[0].partnerId;
		console.log("partnerId", partnerid);
	    var query = User.find({ availedServices: { $elemMatch : {"partnerId":partnerid,"code" : "Sale Fulfilment"}}},function(err,result){
		if(err){
          return callback(err);
		}else{
			//console.log("result",result);
            result.forEach(function(item,index) {
			   finalarray.push(item._id.toString());

               if(item.enterpriseId!="" && item.enterprise==true){
                    
				 var enterpriseid  = item.enterpriseId;
                 enterprise.push(enterpriseid);
		
			   }
            });

            var query = User.find({'enterpriseId': { $in : enterprise}},{_id:1},function(err,userrray){
            if(err){
				  res.status(err.status || 500).send(err);
			} else {
                     userrray.forEach(function(item,index) {
			         enterpriseuserarray.push(item._id.toString());
                    });
					var final = finalarray.concat(enterpriseuserarray);
					var query = Product.find({ 'seller._id': { $in : final}},function(err,products){
            if(err){
				  res.status(err.status || 500).send(err);
			  }else{
				   return callback(null,products)
			  }  
		    });
			}
		   });
		}
	});
	}
});
}

exports.fetchFAData = function(req,res){
	console.log("I am hit");
      var filter = {};
	  if(req.query.mobile){
		filter.mobile = req.query.mobile;
	  }
      fetchData(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	return res.json(results);
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
};

function paginatedResult(req, res, modelRef, filter, result) {
  console.log("I am pagination");
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
			console.log("######rrrr", err);
			handleError(res, err);
		})

}