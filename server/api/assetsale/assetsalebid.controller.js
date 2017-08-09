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

var dealStatuses=['Decision Pending','Approved','EMD Received','Rejected-EMD Failed','Full Payment Received','Rejected-Full Sale Value Not Realized','DO Issued','Asset Delivered','Acceptance of Delivery','Offer Rejected','Closed','Bid-Rejected','Cancelled'];
var bidStatuses=['In Progress','Accepted','Auto Accepted','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling','Rejected','Cancelled'];

function create(data,callback){
	if (!data)
			return callback(new APIError( 412,'No data for creation'));
        
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
		return callback(null, results);
	});
}

exports.submitBid = function(req, res) {
	var data = {};
	if (req.query.typeOfRequest == "submitBid") {
		data = req.body;
		//console.log("data to be created", data);
		if (!data || Object.keys(data).length < 1)
			return res.status(412).json({
				err: 'No data found for create'
			});
		create(data, function(err, result) {
			if (err)
				return res.status(err.status || 500).send(err);
			return res.status(201).json(result);
		});
	} else if (req.query.typeOfRequest == "changeBid") {
		var bidResult = {};
		function updateBid(callback) {
			data = {};
			if (req.body.user)
				data.user = req.body.user;
			if (req.body.product && req.body.product.proData){
				data['product.proData'] = req.body.product.proData;
			}
			
			AssetSaleBid.update(data, {
				$set: {
					"offerStatus": offerStatuses[1],
					"bidStatus": bidStatuses[8],
					"dealStatus": dealStatuses[12]
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
				bidResult = result.toObject();
				return callback();
			});
		}

		async.series([updateBid, newBidData], function(err, results) {
			return res.status(201).json(bidResult);
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
	
	if(req.query.bidStatus){
		filter['bidStatus'] = req.query.bidStatus;
	}
	 if (req.query.searchStr) {
       filter['$text'] = {
        '$search': "\""+req.query.searchStr+"\""
      }
  }
  if(req.query.assetStatus){
  	filter.assetStatus=req.query.assetStatus;
  }

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

function fabyadmin(filter,callback){ 
	 var finalarray = [];
    var enterpriseuserarray= [];
    var enterprise =[];
	var bidproducts = [];
       var query = User.find({ availedServices: { $elemMatch : {"code" : "Sale Fulfilment"}}},function(err,result){
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
				  // return callback(null,products)
                     async.each(products, function(item, callback){

                          var filter = {};

                         filter['product.proData'] = item._id;
					     filter.bidStatus = "Accepted";

                           AssetSaleBid.find(filter,function(err,data){

                         if (data.length > 0){
									
                         bidproducts.push(item);

		               }

                     callback(null);
                     });
                     },
                       function(err){
                       console.log("biddata",bidproducts);
				       return callback(null,bidproducts);
                        }
                  );
                }  
		    });
			}
		   });
		}
	});
}

function fetchData(filter,callback){
    var finalarray = [];
    var enterpriseuserarray= [];
    var enterprise =[];
	var bidproducts = [];
   // console.log("user filter", filter);

   var query = Vendor.find(filter,{partnerId:1},function(err,result){
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
				  // return callback(null,products)
				  if(err){
					  return res.status(err.status || 500).send(err);
				  }
                     async.each(products, function(item, callback){
                          var filter = {};
                         //filter.productId = item._id;
						 filter['product.proData'] = item._id;
					     filter.bidStatus = "Accepted";

						   //console.log("products",item._id);

                           AssetSaleBid.find(filter,function(err,data){

                         if (data.length > 0){
									
                         bidproducts.push(item);
		               }
                     callback(null);
                     });

                     },
  
                       function(err){
                      //console.log("bidproductsid",bidproducts);
				       return callback(null,bidproducts);
                    }
                  );
                }  
		    });
			}
		   });
		}
	});
	}
});
}



/*exports.fetchFAData = function(req,res){
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
};*/


exports.fetchFAData = function(req,res){
	console.log("I am hit");
    var filter = {};
	if(req.query.mobile){
		filter['user.mobile'] = req.query.mobile;
		 fetchData(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	return res.json(results);
        });

     }else{

		 filter['services'] = "Sale Fulfilment";
		  fabyadmin(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	return res.json(results);
         });

		 
	 }
     
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