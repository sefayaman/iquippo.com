'use strict';

var _ = require('lodash');
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
			return callback(null, res);
		});
}

function fetchBid(filter,callback){
   console.log("filter###",filter);
   var query=AssetSaleBid.find(filter).populate({
    path: 'user product.proData',
    match: filter
  });
  query.exec(function(err,results){
  	if(err)
		return callback(err);
	console.log("results@@@@",results);
	return callback(null, results);
  });
}

function getBidCount(filter,callback){
if(!filter){
	return callback(new APIError(412,'No filter found'));
}
var query=AssetSaleBid.count(filter);
query.exec(function(err,results){
	if(err)
		return callback(err);
	return callback(null,results);
});
}



exports.submitBid = function(req, res) {
	var data = req.body;
	//data.user = req.user;
	//console.log("data to be created",data);
	if (!data || Object.keys(data).length < 1)
		return res.status(412).json({
			err: 'No data found for create'
		});
	//console.log("create", data);
	create(data, function(err, result) {
		if (err)
			return res.status(err.status || 500).send(err);
		console.log("result", result);
		
		return res.status(201).json(result);
	});

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
  console.log("filter",filter);
    fetchBid(filter,function(err,results){
    	if(err)
    		return res.status(err.status || 500).send(err);
    	console.log("I am result",results)
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

exports.getBidCount=function(req,res){
var filter={};
if(req.params.productId)
	filter['product.proData'] = req.params.productId;
getBidCount(filter,function(err,results){
	if(err)
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
}

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


