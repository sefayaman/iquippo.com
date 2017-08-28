'use strict';

var async = require("async");
var _ = require('lodash');
var AssetSaleModel = require('../api/assetsale/assetsalebid.model');
var AssetSaleUtil = require('../api/assetsale/assetsaleutil');
var Product = require('../api/product/product.model');

var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling Period','Rejected','Accepted','Auto Accepted'];
var tradeTypeStatuses = ['SELL','BOTH','NOT_AVAILABLE'];

var TimeInterval =  1*60*1000;/*Service interval*/

  function trackBidRequests(){
    async.parallel([trackCoolingPeriod,trackPaymentPeriod],function(err){
      if(err)
        console.log('Error in asset sale job',err);
      return setTimeout(function () { trackBidRequests(); },TimeInterval);
    });
  }

  function trackCoolingPeriod(callback){
    var filter = {};
    filter.cooling = true;
    filter.coolingEndDate = {$lt : new Date()};
    filter.deleted = false;
    filter.status = true;
    Product.find(filter,function(error,products){
      if(error) return callback(error);
      if(!products.length)
        return callback();
       async.eachLimit(products,5,initialize,function(err,res){
          callback(err);
       });
    });

    function initialize(prd,cb){

      AssetSaleUtil.getMasterBasedOnUser(prd.seller._id,{},'saleprocessmaster',function(err,entMasterData){
         if(err) return cb(err);
         if(!entMasterData || !entMasterData.emdPeriod)
          return cb("emd period not found");
          var filterObj = {};
          filterObj.dealStatus = dealStatuses[0];
          filterObj['product.proData'] = prd._id + "";
          AssetSaleModel.find(filterObj,function(err,bids){
            if(err || !bids.length){
              if(!err)
                Product.update({_id:prd._id},{$set:{cooling:false}}).exec();
              if(!err)
              return cb(err);
            }

            var maxBid = getMaxBid(bids);
            if(maxBid){
              maxBid.emdStartDate = new Date(); 
              maxBid.emdEndDate = new Date().addDays(entMasterData.emdPeriod);
              if(maxBid.emdEndDate)
                maxBid.emdEndDate.setHours(24,0,0,0);
              maxBid.product.prevTradeType = prd.tradeType;
              AssetSaleUtil.setStatus(maxBid,bidStatuses[7],'bidStatus','bidStatuses');
              AssetSaleUtil.setStatus(maxBid,dealStatuses[6],'dealStatus','dealStatuses'); 
            }

            bids.forEach(function(item){
              if(item._id == maxBid._id )
                return;
              AssetSaleUtil.setStatus(item,bidStatuses[5],'bidStatus','bidStatuses');
            });

            async.eachLimit(bids,2,updateBid,function(err){
              if(!err)
              Product.update({_id:prd._id},{$set:{tradeType:tradeTypeStatuses[2],cooling:false,bidRequestApproved:true}}).exec();
              return cb(err);
            });
          });
      });

      function getMaxBid(bids){
        var maxBid = bids[0];
        for(var i=0;i < bids.length ; i++){
          if(maxBid.bidAmount < bids[i].bidAmount)
            maxBid = bids[i];
        }
        return maxBid;
      }

      function updateBid(bid,innerCallback){
        var bidId = bid._id;
        delete bid._id;
        AssetSaleModel.update({_id:bidId},{$set:bid},function(err,res){
          if(err) {console.log(err);}
          return innerCallback(err);
        });
      }
    }
  }

  function trackPaymentPeriod(callback){
    var filter = {};
    filter.dealStatus = {$in:[dealStatuses[6],dealStatuses[7]]};
    filter.bidStatus = bidStatuses[7];
    AssetSaleModel.find(filter,function(err,resList){
      if(err || !resList.length) return callback(err);
      async.eachLimit(resList,5,initialize,function(err){
        callback(err);
      });
    });

    function initialize(item,cb){
        var bidId = item._id;
        delete item._id;
       if(item.dealStatus == dealStatuses[6]){  
         var isExpired = checkExpiryDate(item.emdEndDate);
         if(isExpired){
            AssetSaleUtil.setStatus(item,bidStatuses[3],'bidStatus','bidStatuses');
            AssetSaleUtil.setStatus(item,dealStatuses[3],'dealStatus','dealStatuses');
            updateBid();

         }else
           return cb();

        }else if(item.dealStatus == dealStatuses[7]){
            var isExpired = checkExpiryDate(item.fullPaymentEndDate);
           if(isExpired){
              AssetSaleUtil.setStatus(item,bidStatuses[4],'bidStatus','bidStatuses');
              AssetSaleUtil.setStatus(item,dealStatuses[4],'dealStatus','dealStatuses');
              updateBid();
          }else
            return cb();
        }else
          return cb();

    function updateBid(){
        item.status = false;
        AssetSaleModel.update({_id:bidId},{$set:item},function(err){
          if(err){
            return cb(err);
          }
          Product.update({_id:item.product.proData},{$set:{tradeType:item.product.prevTradeType,bidRequestApproved:false,bidReceived:false,bidCount:0,highestBid:0}}).exec();;
          return cb();
        });
    }
  }
}

  function checkExpiryDate(date){
    if(!date)
      return false;
    var currDate = new Date();
    var dt = new Date(date);
    if(currDate >= dt)
      return true;
    else
      return false;
  }

exports.start = function() {
  console.log("Asset sale service started");
  trackBidRequests();
};