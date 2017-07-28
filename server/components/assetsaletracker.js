'use strict';

var async = require("async");
var _ = require('lodash');
var AssetSaleModel = require('../api/assetsale/assetsalebid.model');
var AssetSaleUtil = require('../api/assetsale/assetsaleutil');
var Product = require('../api/product/product.model');

var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling','Rejected','Accepted','Auto Accepted'];
var tradeTypeStatuses = ['SELL','BOTH','Not Available'];

var TimeInterval =  15*60*1000;/*Service interval*/

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

      AssetSaleUtil.getMasterBasedOnUser(prd.seller._id,{},'enterprisemaster',function(err,entMasterData){
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

            for(var i=0;i < bids.length ; i++){
              if(bids[i].bidStatus === bidStatuses[7]){
                bids[i].emdStartDate = new Date(); 
                bids[i].emdEndDate = new Date().addDays(entMasterData.emdPeriod);
                if(bids[i].emdEndDate)
                  bids[i].emdEndDate.setHours(24,0,0,0); 
                break;
              }
            }

            async.eachLimit(bids,2,updateBid,function(err){
              if(!err)
              Product.update({_id:prd._id},{$set:{tradeType:tradeTypeStatuses[2],cooling:false}}).exec();
              return cb(err);
            });
          });
      });

      function updateBid(bid,innerCallback){
        var bidId = bid._id;
        delete bid._id;
        if(bid.bidStatus === bidStatuses[7]){
          bid.product.prevTradeType = prd.tradeType;
          AssetSaleUtil.setStatus(bid,dealStatuses[6],'dealStatus','dealStatuses');
        }
        else{
          bid.status = false;
          AssetSaleUtil.setStatus(bid,dealStatuses[5],'bidStatus','bidStatuses');
        }
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
            console.log("exp",isExpired);
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
          Product.update({_id:item.product.proData},{$set:{tradeType:item.product.tradeType,bidReceived:false}}).exec();;
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