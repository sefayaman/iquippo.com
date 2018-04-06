'use strict';

var moment = require("moment");
var async = require("async");
var _ = require('lodash');
var AssetSaleModel = require('../api/assetsale/assetsalebid.model');
var AssetSaleUtil = require('../api/assetsale/assetsaleutil');
var Product = require('../api/product/product.model');
var Event = require('../api/common/event.model');

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

              _checkHolidayExistAndAdd(maxBid.emdStartDate, maxBid.emdEndDate, function(err, revisedDate) {
                maxBid.emdEndDate = revisedDate;
                maxBid.product.prevTradeType = prd.tradeType;
                AssetSaleUtil.setStatus(maxBid,bidStatuses[7],'bidStatus','bidStatuses');
                AssetSaleUtil.setStatus(maxBid,dealStatuses[6],'dealStatus','dealStatuses');

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
            } else {
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
            }
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

      if(selBid) {
        _checkHolidayExistAndAdd(selBid.startDate, selBid.emdEndDate, function(err, revisedDate) {
          selBid.endDate = revisedDate;
          async.eachLimit(actionableBids,3,updateBid,function(err){
            if(err)
              return callback(err);
            if(item.updateProduct)
                Product.update({_id:item.product.proData},{$set:{tradeType:item.product.prevTradeType,bidReceived:bidRec,bidRequestApproved:false,bidCount:bidCount,highestBid:highestBid}}).exec();
            if(selBid)
              AssetSaleUtil.sendNotification([{action:"APPROVE",ticketId:selBid.ticketId}]);
            return callback();
          });
        });
      } else {
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
  if(bid.lastAccepted || !otherBids.length || bid.autoApprove)
    return selBid;
  otherBids.sort(function(a,b){
    return a.bidAmount - b.bidAmount;
  });
  otherBids.reverse();
  selBid = otherBids[0];
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

function _checkHolidayExistAndAdd(startDate, endDate, cb) {
  var sdt = startDate
  var edt = endDate;
  var filter = {
    start: { $gte: startDate },
    end: { $lte: endDate }
  };
  Event.find(filter).lean().exec(function(err, events) {
    if(!err && events) {
      events.forEach(function(obj) {
        edt = _calculateHolidayRange(obj, edt);
      });
    }
    return cb(null, edt);
  });
}

// Checks if emd period/payment period start date is same as day listed in holidays
// function _handleIfSameDay(sdt, edt) {
//   var mins = 60 - sdt.getMinutes();
//   if(mins > 0) {
//     var hours = 23 - sdt.getHours();
//   } else {
//     var hours = 24 - sdt.getHours();
//   }
//   edt = edt.addHours(hours);
//   edt = edt.addMinutes(mins);
//   return edt;
// }

// If holiday is in date range
function _calculateHolidayRange(obj, emdEndDate) {
  var sdt = moment(obj.start);
  var edt = moment(obj.end);

  if(sdt < edt) {
    var dayCount = edt.diff(sdt, 'days');
    emdEndDate = emdEndDate.addDays(dayCount+1);
  }
  return emdEndDate;
}

exports.start = function() {
  console.log("Asset sale service started");
  trackBidRequests();
};