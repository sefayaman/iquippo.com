'use strict';

var async = require("async");
var _ = require('lodash');
var AssetSaleModel = require('../api/assetsale/assetsalebid.model');
var AssetSaleUtil = require('../api/assetsale/assetsaleutil');
var Product = require('../api/product/product.model');

var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling Period','Rejected','Accepted','Auto Accepted'];
var tradeTypeStatuses = ['SELL','BOTH','NOT_AVAILABLE'];
var _sendAndUpdateViaSocket = require('../realTimeSocket')._sendAndUpdateViaSocket;

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
              //if(maxBid.emdEndDate)
                //maxBid.emdEndDate.setHours(24,0,0,0);
              maxBid.product.prevTradeType = prd.tradeType;
              AssetSaleUtil.setStatus(maxBid,bidStatuses[7],'bidStatus','bidStatuses');
              AssetSaleUtil.setStatus(maxBid,dealStatuses[6],'dealStatus','dealStatuses'); 
              //AssetSaleUtil.sendNotification([{action:"APPROVE",ticketId:maxBid.ticketId}]);
            }

            bids.forEach(function(item){
              if(item._id == maxBid._id )
                return;
              AssetSaleUtil.setStatus(item,bidStatuses[5],'bidStatus','bidStatuses');
            });

            async.eachLimit(bids,2,updateBid,function(err){
              if(!err){
                AssetSaleUtil.sendNotification([{action:"APPROVE",ticketId:maxBid.ticketId}]);
                Product.update({_id:prd._id},{$set:{tradeType:tradeTypeStatuses[2],cooling:false,bidRequestApproved:true}}).exec();
              }
              return cb(err);
            });
          });
      });
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
       if(item.dealStatus == dealStatuses[6]){  
         var isExpired = checkExpiryDate(item.emdEndDate);
         if(isExpired){
            AssetSaleUtil.setStatus(item,bidStatuses[3],'bidStatus','bidStatuses');
            AssetSaleUtil.setStatus(item,dealStatuses[3],'dealStatus','dealStatuses');
            AssetSaleUtil.sendNotification([{action:"EMDFAILED",ticketId:item.ticketId}]);
            if(!item.autoApprove)
              item.findNextBid = true;
            item.status = false;
            async.parallel({saleProcessData:getSaleProcessMaster,otherBids:getOtherBids},processBids);
         }else
           return cb();

        }else if(item.dealStatus == dealStatuses[7]){
            var isExpired = checkExpiryDate(item.fullPaymentEndDate);
           if(isExpired){
              AssetSaleUtil.setStatus(item,bidStatuses[4],'bidStatus','bidStatuses');
              AssetSaleUtil.setStatus(item,dealStatuses[4],'dealStatus','dealStatuses');
              AssetSaleUtil.sendNotification([{action:"FULLPAYMENTFAILED",ticketId:item.ticketId}]);
               item.status = false;
              async.parallel({otherBids:getOtherBids},processBids);
          }else
            return cb();
        }else
          return cb();

    function processBids(err,result){
      if(err)
        return cb(err);

      var actionableBids = [];
      actionableBids.push(item);
      var selBid = null;
      if(item.findNextBid)
        selBid = nextApprovableBid(item,result.otherBids);
      if(selBid){
        selBid.emdStartDate = new Date();
        if(result.saleProcessData && result.saleProcessData.emdPeriod) 
          selBid.emdEndDate = new Date().addDays(result.saleProcessData.emdPeriod || 0);
        //if(selBid.emdEndDate)
          //selBid.emdEndDate.setHours(24,0,0,0);
        selBid.product.prevTradeType = item.product.prevTradeType;
        AssetSaleUtil.setStatus(selBid,bidStatuses[7],'bidStatus','bidStatuses');
        AssetSaleUtil.setStatus(selBid,dealStatuses[6],'dealStatus','dealStatuses');
        actionableBids.push(selBid); 
        if(item.lastAccepted){
          var largerBids = result.otherBids.filter(function(bid){
                return bid.bidAmount >= item.bidAmount; 
            });
          if(largerBids && largerBids.length){
            largerBids.sort(function(a,b){
              return a.bidAmount - b.bidAmount;
            });
            largerBids[0].lastAccepted = true;
            actionableBids.push(largerBids[0]);
          }
        }
        //AssetSaleUtil.sendNotification([{action:"APPROVE",ticketId:selBid.ticketId}]);
      }else{
        item.updateProduct = true;
        result.otherBids.forEach(function(bid){
          AssetSaleUtil.setStatus(bid,dealStatuses[0],'dealStatus','dealStatuses');
          AssetSaleUtil.setStatus(bid,bidStatuses[0],'bidStatus','bidStatuses');
          actionableBids.push(bid);
        });
      }
      var bidCount = result.otherBids.length || 0;
      var highestBid = 0;
      if(result.otherBids.length)
        highestBid = getMaxBid(result.otherBids).bidAmount || 0;
      var bidRec = true;
      if(bidCount === 0)
        bidRec = false;
      async.eachLimit(actionableBids,3,updateBid,function(err){
        if(err)
          return callback(err);
        if(item.updateProduct)
            Product.update({_id:item.product.proData},{$set:{tradeType:item.product.prevTradeType,bidReceived:bidRec,bidRequestApproved:false,bidCount:bidCount,highestBid:highestBid}}).exec();
        if(selBid)
          AssetSaleUtil.sendNotification([{action:"APPROVE",ticketId:selBid.ticketId}]);
        return callback();
      });
    }

    function getOtherBids(innerCallback){
      AssetSaleModel.find({dealStatus:dealStatuses[0],status:true,'product.proData':item.product.proData},function(err,otherBids){
        if(err)
          return innerCallback(err);
        innerCallback(null,otherBids);
      });
    }

    function getSaleProcessMaster(innerCallback){
      if(item.autoApprove)
        return innerCallback();

      if(!item.product || !item.product.seller || !item.product.seller._id)
        return innerCallback("Seller not found");

      AssetSaleUtil.getMasterBasedOnUser(item.product.seller._id,{},'saleprocessmaster',function(err,saleProcessData){
         if(err) return innerCallback(err);
         if(!saleProcessData || !saleProcessData.emdPeriod)
          return innerCallback("emd period not found");
          return innerCallback(null,saleProcessData);
      });

    }
  }
}

function nextApprovableBid(bid,otherBids){
  var selBid = null;
  if(!otherBids.length || bid.autoApprove)
    return selBid;
  otherBids.sort(function(a,b){
    return a.bidAmount - b.bidAmount;
  });
  otherBids.reverse();
  selBid = otherBids[0];
 if(bid.lastAccepted && selBid.bidAmount < bid.bidAmount)
   selBid = null;
  return selBid;
}

function updateBid(bid,callback){
  var bidId = bid._id;
  delete bid._id;
  bid.updatedAt = new Date();
  AssetSaleModel.update({_id:bidId},{$set:bid},function(err,res){
    if(err) {
      return callback(err);
    }
    _sendAndUpdateViaSocket('onSystemUpdateBidSocket',bid);
    return callback();
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