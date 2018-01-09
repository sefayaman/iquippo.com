process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var Product = require('./../api/product/product.model');
var AssetSaleModel = require('./../api/assetsale/assetsalebid.model');
var config = require('./../config/environment');
var async = require("async");

var mongoose = require('mongoose');
var tradeTypeStatuses = ['SELL','BOTH','NOT_AVAILABLE'];
var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling Period','Rejected','Accepted','Auto Accepted'];

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  util.error('MongoDB connection error: ' + err);
  process.exit(-1);
});




function init(processCb) {
  var updateFilter = {$or : [{bidStatus:bidStatuses[1],dealStatus:dealStatuses[2]},{bidStatus : bidStatuses[6],dealStatus: dealStatuses[1]}],status:true};
  console.log("filter",updateFilter);
    AssetSaleModel.update(updateFilter,{$set:{status:false}},{multi:true},function(err,resData){
    if(err) return processCb(err);
    console.log("res Data",resData);
     getProduct();
  });

  function getProduct(){
    Product.find({bidReceived:true,deleted:false},function(err,products){
      if(err) return processCb(err);
      async.eachLimit(products,3,processBids,function(err,result){
        return processCb();
      });
    });
  }

  function processBids(prd,cb){
    var filter = {'product.proData':prd._id,status:true};
    AssetSaleModel.find(filter,function(err,bids){
      if(err) return cb(err);
      if(bids.length){
        prd.bidCount = bids.length;
        prd.highestBid = getMaxBid(bids).bidAmount || 0;
      }else
        prd.bidReceived = false;
      Product.update({_id:prd._id},{$set:prd},function(error,resultData){
        if(err) console.log("$$$$$$$$",error);
        return cb();
      });
    });
  }

  function getMaxBid(bids){
    var maxBid = bids[0];
    for(var i=0;i < bids.length ; i++){
      if(maxBid.bidAmount < bids[i].bidAmount)
        maxBid = bids[i];
    }
    return maxBid;
  }
}

 

if (require.main === module) {
  console.log("Started At --- " + new Date());
	(function() {
		init(function(err, errList) {
			if (err) {
				util.log(err);
				return process.exit(1);
			}
      console.log("Done without error --- " + new Date());
			return process.exit(0);
		});
	}());
}


