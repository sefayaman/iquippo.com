'use strict';

var _ = require('lodash');
var Seq = require('seq');
var async = require('async');
var trim = require('trim');
var xlsx = require('xlsx');
var moment = require('moment');
var Utility = require('./../../components/utility.js');
var AssetSaleBid = require('./assetsalebid.model');
var AssetSaleUtil = require('./assetsaleutil');
var APIError = require('../../components/_error');
var offerStatuses = ['Bid Received', 'Bid Changed', 'Bid Withdraw'];
var Product = require('../product/product.model');
var User = require('../user/user.model');
var Vendor = require('../vendor/vendor.model');
var VatModel = require('../common/vattax.model');
var MarkupPrice = require('../common/markupprice.model');
var fieldConfig = require('./fieldsConfig');
var _sendAndUpdateViaSocket = require('../../realTimeSocket')._sendAndUpdateViaSocket;

var tradeTypeStatuses = ['SELL', 'BOTH', 'NOT_AVAILABLE'];
var dealStatuses = ['Decision Pending', 'Offer Rejected', 'Cancelled', 'Rejected-EMD Failed', 'Rejected-Full Sale Value Not Realized', 'Bid-Rejected', 'Approved', 'EMD Received', 'Full Payment Received', 'DO Issued', 'Asset Delivered', 'Acceptance of Delivery', 'Closed'];
var bidStatuses = ['In Progress', 'Cancelled', 'Bid Lost', 'EMD Failed', 'Full Payment Failed', 'Auto Rejected-Cooling Period', 'Rejected', 'Accepted', 'Auto Accepted'];


exports.getEMDBasedOnUser = function (req, res) {
    var queryParam = req.query;
    var filter = {};
    if (queryParam.categoryId)
        filter['category.categoryId'] = queryParam.categoryId;
    AssetSaleUtil.getMasterBasedOnUser(queryParam.sellerUserId, filter, 'emdmaster', function (err, result) {
        if (err)
            return res.status(err.status || 500).send(err);

        return res.status(200).json(result);
    });
};

exports.calculateGst = function (req, res, next) {
    req.result = {};
    req.result.taxRate = 0;
    var donotCalGST = true;
    if (donotCalGST)
        return next();

    async.parallel({gst: getGST, defaultGST: getDefaultGST}, function (err, result) {
        if (err)
            return res.status(500).send(err);
        var gst = null;
        if (result.gst)
            gst = result.gst;
        else if (result.defaultGST)
            gst = result.defaultGST;
        else
            return res.status(412).send("Unable to process request.Please contact support team.");
        req.result.taxRate = (Number(req.query.bidAmount) * Number(gst.amount)) / 100;
        req.result.taxRate = Math.round(req.result.taxRate);
        return next();
    });

    function getGST(cb) {
        var queryParam = req.query;
        var filter = {};
        if (queryParam.groupId)
            filter.group = queryParam.groupId;
        if (queryParam.categoryId)
            filter.category = queryParam.categoryId;
        if (queryParam.stateId)
            filter.state = queryParam.stateId;
        if (queryParam.currentDate && queryParam.currentDate === 'y') {
            filter["effectiveFromDate"] = {$lte: new Date()};
            filter["effectiveToDate"] = {$gte: new Date()};
        }
        var query = VatModel.find(filter);
        query.exec(function (err, result) {
            if (err)
                return res.status(500).send(err);
            if (result.length)
                cb(null, result[0]);
            else
                cb(null, null);
        });
    }

    function getDefaultGST(cb) {
        var filter = {};
        filter.taxType = "Default";
        var query = VatModel.find(filter);
        query.exec(function (err, otherRes) {
            if (err)
                return res.status(500).send(err);
            if (otherRes.length)
                cb(null, otherRes[0]);
            else
                cb(null, null);
        });
    }
};

exports.calculateTcs = function (req, res, next) {
    if (Number(req.query.bidAmount) + Number(req.result.taxRate) > 1000000)
        req.result.tcs = Number(req.query.bidAmount) * 0.01;
    else
        req.result.tcs = 0;
    req.result.tcs = Math.round(req.result.tcs || 0);

    return next();
};

exports.callculateParkingCharge = function (req, res, next) {
    var prdId = req.query.productId;
    Product.find({_id: prdId, status: true, deleted: false}, function (err, products) {
        if (err)
            return res.status(500).send(err);
        if (!products.length)
            return res.status(412).send("Invalid product");
        var todayDate = moment().daysInMonth();
        var repoDate = moment(products[0].repoDate);
        var a = moment(repoDate, 'DD/MM/YYYY');
        var b = moment(todayDate, 'DD/MM/YYYY');
        var days = b.diff(a, 'days') + 1;
        req.result.parkingCharges = days * products[0].parkingChargePerDay || 0;
        req.result.parkingCharges = Math.round(req.result.parkingCharges);
        return next();

    });
};

exports.getBidOrBuyCalculation = function (req, res) {
    req.result.total = Math.round(req.result.taxRate + req.result.tcs + req.result.parkingCharges + parseInt(req.query.bidAmount));
    res.status(200).json(req.result);
};

// Updates an existing record in the DB.
exports.update = function (req, res, next) {
    async.eachLimit(req.bids, 5, _update, function (err) {
        if (err)
            return handleError(res, err);
        if (['approve', 'deliveryaccept', 'doissued', 'emdpayment', 'fullpayment', 'reject'].indexOf(req.query.action) !== -1)
            sendStatusMail(req.bids[0]);
        var bidArr = [];
        if (req.bidLost) {
            req.bids.forEach(function (item, index) {
                if (!index)
                    return;
                var bidObj = {action: "BIDREJECTED"};
                bidObj.ticketId = item.ticketId;
                bidArr.push(bidObj);
            });
            AssetSaleUtil.sendNotification(bidArr);
        }
        next();
    });

    function _update(bid, cb) {
        var bidId = bid._id;
        if (bid._id) {
            delete bid._id;
        }
        bid.updatedAt = new Date();
        AssetSaleBid.update({_id: bidId}, {$set: bid}, function (err) {
            cb(err);
        });
    }
};

function sendStatusMail(bid) {
    var bidArr = [];
    var bidObj = {};
    switch (bid.dealStatus || bid.bidStatus) {
        case dealStatuses[6] /*Approved*/:
            bidObj.action = "APPROVE";
            break;
        case dealStatuses[7] /*EMD Received*/:
            bidObj.action = "EMDPAYMENT";
            break;
        case dealStatuses[8] /*Full Payment Received*/:
            bidObj.action = "FULLPAYMENT";
            break;
        case dealStatuses[9] /*do issued*/:
            bidObj.action = "DOISSUED";
            break;
        case dealStatuses[1] /*Offer Rejected*/:
            bidObj.action = "OFFERREJECTED";
            break;
        case dealStatuses[12] /*Closed*/:
            bidObj.action = "CLOSED";
            break;
    }
    if (!bidObj.action)
        return;

    bidObj.ticketId = bid.ticketId;
    bidArr.push(bidObj);
    AssetSaleUtil.sendNotification(bidArr);
}

exports.validateUpdate = function (req, res, next) {
    if (['approve', 'deliveryaccept', 'emdpayment', 'fullpayment', 'reject'].indexOf(req.query.action) !== -1)
        async.parallel([validateBid, validateOtherBids, validateProduct], onComplete);
    else
        async.parallel([validateBid, validateProduct], onComplete);

    function onComplete(err, data) {

        if (err) {
            return res.status(err.statusCode).send(err.message);
        }
        req.bids = [];
        req.bids[req.bids.length] = req.body;
        if (req.query.action === 'approve') {
            if(req.bid.bidStatus !== bidStatuses[0])
                return res.status(412).send("Invalid status update");
            getSaleProcessMaster(function (entData) {
                if (!entData) {
                    return res.status(404).send("Cooling period configuration is not found");
                }
                if(entData.coolingPeriod == 0){
                    var maxBid = req.bids[0];
                    if(maxBid){
                      maxBid.emdStartDate = new Date(); 
                      maxBid.emdEndDate = new Date().addDays(entData.emdPeriod);
                      maxBid.product.prevTradeType = req.product.tradeType;
                      req.product.cooling = false;
                      req.product.tradeType = tradeTypeStatuses[2];
                      req.product.bidRequestApproved = true;
                      AssetSaleUtil.setStatus(maxBid,bidStatuses[7],'bidStatus','bidStatuses',req.user);
                      AssetSaleUtil.setStatus(maxBid,dealStatuses[6],'dealStatus','dealStatuses',req.user); 
                      //AssetSaleUtil.sendNotification([{action:"APPROVE",ticketId:maxBid.ticketId}]);
                    }

                    req.otherBids.forEach(function(item){
                        if(item._id == maxBid._id )
                            return;
                        if (item.bidStatus === bidStatuses[7]) {
                            item.lastAccepted = false;
                            AssetSaleUtil.setStatus(item, bidStatuses[0], 'bidStatus', 'bidStatuses', req.user);
                        }
                        AssetSaleUtil.setStatus(item,bidStatuses[5],'bidStatus','bidStatuses',req.user);
                        req.bids.push(item);
                    });
                    req.updateProduct = true;
                    return next();
                }
                if (!req.product.cooling) {
                    req.product.cooling = true;
                    req.product.coolingStartDate = new Date();
                    if (entData.coolingPeriodIn === 'Hours') {
                        if (entData.coolingPeriod > 0)
                            req.product.coolingEndDate = new Date().addHours(entData.coolingPeriod || 0);
                        else
                            req.product.coolingEndDate = new Date();
                    } else {
                        if (entData.coolingPeriod > 0)
                            req.product.coolingEndDate = new Date().addDays(entData.coolingPeriod || 0);
                        else
                            req.product.coolingEndDate = new Date();
                    }
                    req.updateProduct = true;

                }
                if (req.bids.length)
                    req.bids[0].lastAccepted = true;
                req.otherBids.forEach(function (item) {
                    if (item.bidStatus === bidStatuses[7]) {
                        item.lastAccepted = false;
                        AssetSaleUtil.setStatus(item, bidStatuses[0], 'bidStatus', 'bidStatuses', req.user);
                        req.bids.push(item);
                    }
                });
                next();
            });

        } else if (req.query.action === 'emdpayment') {
            var isValidStatus = bidStatuses.indexOf(req.bid.bidStatus) > 6 && req.bid.dealStatus === dealStatuses[6] ? true:false;
            if(!isValidStatus)
                 return res.status(412).send("Invalid status update");
            //if(req.bid.emdPayment.remainingPayment === 0){
            getSaleProcessMaster(function (entData) {
                if (!entData.fullPaymentPeriod)
                    return res.status(404).send("Full payment period is not found");
                req.body.fullPaymentStartDate = new Date();
                req.body.fullPaymentEndDate = new Date().addDays(entData.fullPaymentPeriod);
                //if(req.body.fullPaymentEndDate)
                //	req.body.fullPaymentEndDate = req.body.fullPaymentEndDate.setHours(24,0,0,0);
                req.otherBids.forEach(function (item) {
                    item.status = false;
                    AssetSaleUtil.setStatus(item, bidStatuses[2], 'bidStatus', 'bidStatuses', req.user);
                    AssetSaleUtil.setStatus(item, dealStatuses[5], 'dealStatus', 'dealStatuses', req.user);
                    req.bids.push(item);
                });
                req.bidLost = true;
                next();
            });
            //}
            //else
            //	return res.status(412).send("EMD payment remaining");		
        } else if (req.query.action === 'fullpayment') {
            var isValidStatus = bidStatuses.indexOf(req.bid.bidStatus) > 6 && req.bid.dealStatus === dealStatuses[7] ? true:false;
            if(!isValidStatus)
                return res.status(412).send("Invalid status update");
            req.otherBids.forEach(function (item) {
                item.status = false;
                AssetSaleUtil.setStatus(item, bidStatuses[2], 'bidStatus', 'bidStatuses', req.user);
                AssetSaleUtil.setStatus(item, dealStatuses[5], 'dealStatus', 'dealStatuses', req.user);
                req.bids.push(item);
            });
            req.bidLost = true;
            //if(req.bid.fullPayment.remainingPayment == 0)
            next();
            //else
            //	return res.status(412).send("Full payment remaining");		
        } else if (req.query.action === 'doissued') {
            var isValidStatus = bidStatuses.indexOf(req.bid.bidStatus) > 6 && req.bid.dealStatus === dealStatuses[8] ? true:false;
            if(!isValidStatus)
                return res.status(412).send("Invalid status update");
            req.product.assetStatus = 'sold';
            req.product.updatedAt = new Date();
            AssetSaleUtil.setStatus(req.product, 'sold', 'assetStatus', 'assetStatuses', req.user);
            req.product.isSold = true;
            req.updateProduct = true;

            next();
        } else if (req.query.action === 'deliveryaccept') {
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
        } else if (req.query.action === 'reject') {
            if([bidStatuses[0],bidStatuses[7],bidStatuses[8]].indexOf(req.bid.bidStatus) === -1)
                return res.status(412).send("Invalid status update");

            if (req.bid.dealStatus === dealStatuses[6]) {
                var selBid = null;
                if (!req.bid.autoApprove)
                    selBid = nextApprovableBid(req.bid, req.otherBids);
                getSaleProcessMaster(function (entData) {
                    if (selBid) {
                        selBid.emdStartDate = new Date();
                        if (entData.emdPeriod)
                            selBid.emdEndDate = new Date().addDays(entData.emdPeriod || 0);
                        selBid.product.prevTradeType = req.bid.product.prevTradeType;
                        AssetSaleUtil.setStatus(selBid, bidStatuses[7], 'bidStatus', 'bidStatuses',req.user);
                        AssetSaleUtil.setStatus(selBid, dealStatuses[6], 'dealStatus', 'dealStatuses',req.user);
                        req.bids.push(selBid);
                        //AssetSaleUtil.sendNotification([{action: "APPROVE", ticketId: selBid.ticketId}]);
                    } else {
                        req.updateProduct = true;
                        req.otherBids.forEach(function (item) {
                            AssetSaleUtil.setStatus(item, dealStatuses[0], 'dealStatus', 'dealStatuses',req.user);
                            AssetSaleUtil.setStatus(item, bidStatuses[0], 'bidStatus', 'bidStatuses',req.user);
                            req.bids.push(item);
                        });
                        var bidCount = req.otherBids.length || 0;
                        var highestBid = 0;
                        if (req.otherBids.length)
                            highestBid = getMaxBid(req.otherBids).bidAmount || 0;
                        var bidRec = true;
                        if (bidCount === 0)
                            bidRec = false;
                        req.product.tradeType = req.bid.product.prevTradeType;
                        req.product.bidReceived = bidRec;
                        req.product.bidRequestApproved = false;
                        req.product.bidCount = bidCount;
                        req.product.highestBid = highestBid;
                    }
                    req.bids[0].status = false;
                    next();
                });
            } else {
                if (req.bid.dealStatus === dealStatuses[0] && req.bid.bidStatus === bidStatuses[7] && req.bid.lastAccepted)
                    req.bids[0].lastAccepted = false;
                var bidCount = req.otherBids.length || 0;
                var highestBid = 0;
                if (req.otherBids.length)
                    highestBid = getMaxBid(req.otherBids).bidAmount || 0;
                var bidRec = true;
                if (bidCount === 0)
                    bidRec = false;
                if (req.bid.bidStatus === bidStatuses[7])
                    req.product.cooling = false;
                req.product.bidReceived = bidRec;
                req.product.bidCount = bidCount;
                req.product.highestBid = highestBid;
                req.bids[0].status = false;
                req.updateProduct = true;
                next();
            }
        } else
            next();

    }

    function nextApprovableBid(bid, otherBids) {
        var selBid = null;
        if (bid.lastAccepted || !otherBids.length || bid.autoApprove)
            return selBid;
        otherBids.sort(function (a, b) {
            return a.bidAmount - b.bidAmount;
        });
        otherBids.reverse();
        selBid = otherBids[0];
        return selBid;
    }

    function getMaxBid(bids) {
        var maxBid = bids[0];
        for (var i = 0; i < bids.length; i++) {
            if (maxBid.bidAmount < bids[i].bidAmount)
                maxBid = bids[i];
        }
        return maxBid;
    }

    function getSaleProcessMaster(cb) {
        AssetSaleUtil.getMasterBasedOnUser(req.product.seller._id, {}, 'saleprocessmaster', function (err, entepriseData) {
            if (err || !entepriseData) {
                return res.status(404).send("Sale Process master is not found");
            }
            return cb(entepriseData);
        });
    }


    function validateBid(callback) {
        AssetSaleBid.findById(req.params.id, function (err, bid) {
            if (err || !bid) {
                return callback({statusCode: 404, message: "Bid not found"});
            }
            req.bid = bid;
            return callback();
        });
    }

    function validateOtherBids(callback) {
        var productId = "";
        if (req.body.product && req.body.product.proData)
            productId = req.body.product.proData;
        if (!productId)
            return callback({statusCode: 404, message: "Bad Request"});

        AssetSaleBid.find({'product.proData': productId, status: true, _id: {$ne: req.params.id}, dealStatus: dealStatuses[0]}, function (err, bids) {
            if (err) {
                return callback({statusCode: 404, message: "Bid not found"});
            }
            req.otherBids = bids;
            return callback();
        });
    }

    function validateProduct(callback) {
        var productId = "";
        if (req.body.product && req.body.product.proData)
            productId = req.body.product.proData;
        if (!productId)
            return callback({statusCode: 404, message: "Bad Request"});
        Product.find({_id: productId, deleted: false, status: true}, function (err, products) {
            if (err || !products.length) {
                return callback({statusCode: 404, message: "It seems product is not available."});
            }
            req.product = products[0];
            return callback();
        });
    }
};

exports.postUpdate = function (req, res, next) {
    var postAction = req.query.action;
    if (req.updateProduct)
        updateProduct();
    else {
        _sendAndUpdateViaSocket('onSubmitBidSocket',req.product);
        return res.status(200).send("Bid request updated successfully");
    }

    function updateProduct() {
        var productId = req.product._id + "";
        delete req.product._id;
        Product.update({_id: productId}, {$set: req.product}, function (error, retData) {
            if (error)
                return handleError(res, error);
            _sendAndUpdateViaSocket('onSubmitBidSocket',req.product);
            return res.status(200).send("Bid updated successfully.");
        });
    }

};

exports.validateSubmitBid = function (req, res, next) {

    if (!req.body || Object.keys(req.body).length < 1)
        return res.status(412).json({err: 'No data found for create'});
    async.parallel([validateProduct, validateOtherBids], onComplete);

    function onComplete(err) {
        if (err)
            return res.status(err.status).send(err.msg);
        if (req.query.typeOfRequest !== "buynow")
            return next();

        AssetSaleUtil.getMasterBasedOnUser(req.product.seller._id, {}, 'saleprocessmaster', function (err, saleProcessData) {
            if (err || !saleProcessData) {
                return res.status(404).send("Sale Process master is not found");
            }
            //return cb(entepriseData);
            if (saleProcessData.buyNowPriceApproval === 'Yes') {
                /*AssetSaleUtil.setStatus(req.body,bidStatuses[7],'bidStatus','bidStatuses',req.user._id);
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
                 });*/
                req.buyNowApprovalValue = saleProcessData.buyNowPriceApproval;
                return next();
            }
            req.body.autoApprove = true;
            AssetSaleUtil.setStatus(req.body, dealStatuses[6], 'dealStatus', 'dealStatuses');
            AssetSaleUtil.setStatus(req.body, bidStatuses[7], 'bidStatus', 'bidStatuses');
            req.body.emdStartDate = new Date();
            req.body.emdEndDate = new Date().addDays(saleProcessData.emdPeriod);
            //if(req.body.emdEndDate)
            //	req.body.emdEndDate.setHours(24,0,0,0);
            req.body.product.prevTradeType = req.product.tradeType;
            req.product.tradeType = tradeTypeStatuses[2];
            var otherBids = req.otherBids;
            req.otherBids = [];
            otherBids.forEach(function (item) {
                AssetSaleUtil.setStatus(item, bidStatuses[5], 'bidStatus', 'bidStatuses');
                req.otherBids.push(item);
            });

            req.autoApprove = true;
            req.buyNowApprovalValue = saleProcessData.buyNowPriceApproval;
            next();

        });

    }

    function validateProduct(callback) {
        Product.findById(req.body.product.proData, function (err, product) {
            if (err) {
                return callback({status: 500, msg: err})
            }
            if (product.assetStatus === 'sold' || product.tradeType == 'NOT_AVAILABLE' || !product.status || product.deleted) {
                return callback({status: 412, msg: "Product is not available for bid!"});
            }
            req.product = product;
            return callback();
        });
    }

    function validateOtherBids(callback) {

        var filter = {};
        if (req.body.user && req.query.typeOfRequest !== "buynow")
            filter.user = req.body.user;
        if (req.body.product && req.body.product.proData)
            filter['product.proData'] = req.body.product.proData;
        filter.offerStatus = offerStatuses[0];
        filter.bidStatus = {$in: [bidStatuses[0]]};
        if (req.query.typeOfRequest === "buynow")
            filter.bidStatus.$in.push(bidStatuses[7]);
        filter.dealStatus = dealStatuses[0];
        AssetSaleBid.find(filter).exec(function (err, bids) {
            if (err)
                return callback({status: 500, msg: err});
            req.otherBids = bids;
            var buynowCount = 0;
            if (req.query.typeOfRequest === "buynow") {
                req.otherBids.forEach(function (bid) {
                    if (bid.offerType === 'Buynow')
                        buynowCount++;
                });
                req.buynowCount = buynowCount;
                return callback();
            }

            req.otherBids.forEach(function (bid) {
                if (req.query.typeOfRequest == "changeBid") {
                    AssetSaleUtil.setStatus(bid, offerStatuses[1], 'offerStatus', 'offerStatuses', req.user);
                    bid.bidChanged = true;
                    //bid.status = false;
                }
                bid.status = false;
                AssetSaleUtil.setStatus(bid, bidStatuses[1], 'bidStatus', 'bidStatuses', req.user);
                AssetSaleUtil.setStatus(bid, dealStatuses[2], 'dealStatus', 'dealStatuses', req.user);
            });
            return callback();
        });
    }

}

function pushNotification(bidsArr) {
    if (bidsArr.length > 0)
        AssetSaleUtil.sendNotification(bids);
}

exports.verifyCalculation = function (req, res, next) {
    var totalAmount = 0;
    var tcs = 0
    totalAmount = Math.round(req.body.gst + parseInt(req.body.actualBidAmount));
    if (Number(totalAmount) > 1000000)
        tcs = Number(totalAmount) * 0.01;
    req.body.tcs = Math.round(tcs || 0);
    req.body.bidAmount = Math.round((totalAmount + req.body.tcs + req.body.parkingCharge) || 0);
    req.body.fullPaymentAmount = Number(req.body.bidAmount) - Number(req.body.emdAmount);
    if (req.body.parkingPaymentTo === 'Yard')
        req.body.fullPaymentAmount = Number(req.body.fullPaymentAmount) - Number(req.body.parkingCharge);
    req.body.emdPayment = {remainingPayment: req.body.emdAmount || 0};
    req.body.fullPayment = {remainingPayment: req.body.fullPaymentAmount || 0};
    return next();
}

exports.submitBid = function (req, res) {
    async.series([newBidData, updateBidAndProduct], function (err) {
        
        if (err)
            return res.status(500).send(err);
        var msg = ""
        if (req.query.typeOfRequest === "buynow" && req.buyNowApprovalValue === 'No' && req.buynowCount === 0)
            msg = "Your Sale process is in process , you may contact us at 03366022059";
        else if (req.query.typeOfRequest === "buynow" && req.buyNowApprovalValue == 'No' && req.buynowCount > 0)
            msg = "Someone else has already submitted the before you , in case of his cancellation you will be getting the same , You may Contact us at 03366022059";
        else if (req.query.typeOfRequest === "buynow" && req.buyNowApprovalValue === 'Yes')
            msg = "Your Buy Now request is submitted successfully. Our executives will get in touch with you. ";
        else
            msg = "Your Bid request has been submitted successfully. Our executives will get in touch with you.";
        return res.status(200).json({message: msg});
        //return res.status(200).send("Bid submitted successfully.");
    });

    function updateBidAndProduct(callback) {
        async.eachLimit(req.otherBids, 5, updateBid, function (err) {
            var filter = {};
            filter.dealStatus = {$in: [dealStatuses[0], dealStatuses[6]]};
            filter.status = true;
            filter['product.proData'] = req.product._id;
            AssetSaleBid.find(filter, function (err, resList) {
                if (err)
                    return callback(err);
                /*if(!resList.length)
                 return callback();*/

                req.product.bidCount = resList.length;
                req.product.bidReceived = true;
                req.product.bidRequestApproved = req.autoApprove ? true : false;
                var highestBid = 0;
                if (resList.length)
                    highestBid = resList[0].bidAmount;
                resList.forEach(function (item) {
                    if (item.bidAmount > highestBid)
                        highestBid = item.bidAmount;
                });
                req.product.highestBid = highestBid;
                var prdId = req.product._id;
                delete req.product._id;
                Product.update({_id: prdId}, {$set: req.product}).exec(function (err) {
                    console.log("err", err);
                });
                return callback();
            });
        });
    }

    function updateBid(bid, cb) {
        var bidId = bid._id;
        delete bid._id;
        bid.updatedAt = new Date();
        AssetSaleBid.update({_id: bidId}, {$set: bid}, function (err) {
            if (err)
                console.log("Error in prevoius bid update", err);
            /*var bidArr = [];
             var bidObj = {};
             bidObj.ticketId = bid.ticketId;
             bidObj.action = "BIDCHANGED";
             bidArr.push(bidObj);
             AssetSaleUtil.sendNotification(bidArr);*/
            return cb();
        });
    }

    function newBidData(callback) {
        var data = req.body;
        AssetSaleBid.create(data, function (err, result) {
            if (err)
                return callback(err);
            //if(req.query.typeOfRequest !== "changeBid") {
            var bidArr = [];
            var bidObj = {};
            if (req.query.typeOfRequest === "changeBid")
                bidObj.action = "BIDCHANGED";
            if (req.query.typeOfRequest === "buynow")
                bidObj.action = "BUYNOW";
            if (req.query.typeOfRequest === "submitBid")
                bidObj.action = "BIDREQUEST";
            bidObj.ticketId = result.ticketId;
            bidArr.push(bidObj);
            AssetSaleUtil.sendNotification(bidArr);
            //}
            return callback();
        });
    }

};

exports.withdrawBid = function (req, res) {

    var withdrawBid = async.seq(getBid, updateBid, updateCountAndBidAmount);

    withdrawBid(function (err, result) {
        if (err)
            return res.status(err.status).send(err.msg);
        var bidArr = [];
        var bidObj = {};
        bidObj.ticketId = result.ticketId;
        bidObj.action = "BIDWITHDRAW";
        bidArr.push(bidObj);
        AssetSaleUtil.sendNotification(bidArr);
        return res.json({msg: "Bid withdrawn Successfully!"});
    });

    function getBid(callback) {
        var filter = {};
        var statusObj = {};
        var bidData = {};
        if (req.body.userId)
            filter.user = req.body.userId;
        if (req.body.productId)
            filter['product.proData'] = req.body.productId;
        if (req.body._id)
            filter._id = req.body._id;
        filter.dealStatus = dealStatuses[0];
        filter.offerStatus = offerStatuses[0];
        filter.bidStatus = bidStatuses[0];
        AssetSaleBid.find(filter).exec(function (err, bid) {
            if (err)
                callback({status: 500, msg: err});
            if (bid.length == 0)
                return callback({status: 404, msg: "No active bid for this product for withdraw!"})
            if (bid.length > 0)
                bidData = bid[0].toObject();
            callback(null, bidData);

        });
    }

    function updateBid(bidData, callback) {

        AssetSaleUtil.setStatus(bidData, bidStatuses[1], 'bidStatus', 'bidStatuses', req.user);
        AssetSaleUtil.setStatus(bidData, dealStatuses[2], 'dealStatus', 'dealStatuses', req.user);
        AssetSaleUtil.setStatus(bidData, offerStatuses[2], 'offerStatus', 'offerStatuses', req.user);
        bidData.status = false;
        var bidId = bidData._id;
        delete bidData._id;
        bidData.updatedAt = new Date();
        AssetSaleBid.update({_id: bidId}, {
            $set: bidData
        }, function (err, result) {
            if (err)
                return callback({status: 500, msg: err});
            return callback(null, bidData);
        });
    }

    function updateCountAndBidAmount(bidData, callback) {
        var filter = {};
        filter.dealStatus = dealStatuses[0];
        filter.status = true;
        filter['product.proData'] = bidData.product.proData;
        AssetSaleBid.find(filter, function (err, resList) {
            if (err)
                return callback({status: 500, msg: err});
            var updatedData = {};
            updatedData.bidCount = resList.length;
            var highestBid = 0;
            if (resList.length)
                highestBid = resList[0].bidAmount;
            resList.forEach(function (item) {
                if (item.bidAmount > highestBid)
                    highestBid = item.bidAmount;
            });
            updatedData.highestBid = highestBid;
            var proId = bidData.product.proData;
            if (updatedData.bidCount === 0)
                updatedData.bidReceived = false;
            Product.update({_id: proId}, {$set: updatedData}).exec();
            return callback(null, bidData);
        });
    }
};

exports.fetchBid = function (req, res) {
    var filter = {};
    filter.bidChanged = false;
    if (req.query.userId)
        filter.user = req.query.userId;

    if (req.query.actionable === 'y')
        filter.status = true;

    if (req.query.actionable === 'n')
        filter.status = false;

    if (req.query.productId)
        filter['product.proData'] = req.query.productId;

    if (req.query.offerStatus)
        filter.offerStatus = req.query.offerStatus;

    if (req.query.dealStatuses)
        filter.dealStatus = {$in: req.query.dealStatuses.split(',')};

    if (req.query.dealStatus)
        filter.dealStatus = req.query.dealStatus;

    if (req.query.bidStatus)
        filter.bidStatus = req.query.bidStatus;

    if (req.query.searchStr) {
        filter['$text'] = {
            '$search': "\"" + req.query.searchStr + "\""
        }
    }
    if (req.query.assetStatus)
        filter.assetStatus = req.query.assetStatus;
    if (req.query.userid)
        filter['product.seller._id'] = req.query.userid + "";
    if (req.sellers && req.sellers.length)
        filter['product.seller._id'] = {$in: req.sellers};
    if (req.query.pagination) {
        paginatedResult(req, res, AssetSaleBid, filter);
        return;
    }
    fetchBid(filter, function (err, results) {
        if (err)
            return res.status(err.status || 500).send(err);
        return res.json(results);
    });
};

function fetchBid(filter, callback) {

    var query = AssetSaleBid.find(filter);
    query.lean().populate('user product.proData')
            .exec(function (err, results) {
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

    async.parallel({count: _count, result: _getResult}, function (err, resObj) {
        if (err)
            return handleError(res, err);
        return res.status(200).json({totalItems: resObj.count, items: resObj.result});
    });

    function _count(cb) {
        modelRef.count(filter, function (err, counts) {
            cb(err, counts);
        });
    }

    function _getResult(cb) {

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
        query.lean().populate('user product.proData')
                .exec(function (err, items) {
                    if (!err && items.length > pageSize * (skipNumber - 1)) {
                        items = items.slice(pageSize * (skipNumber - 1), items.length);
                    } else
                        items = [];
                    if (!isNext && items.length > 0)
                        items.reverse();
                    cb(err, items);
                });
    }

}

exports.getBidCount = function (req, res) {

    async.parallel({pCount: _getCountOnProduct, uCount: _getCountOnUser}, function (err, resObj) {
        if (err)
            return handleError(res, err);
        return res.status(200).json({totalBidCount: resObj.pCount, userBidCount: resObj.uCount});
    });

    function _getCountOnProduct(callback) {
        var filter = {status: true};
        if (req.query.productId)
            filter['product.proData'] = req.query.productId;
        filter.bidStatus = {$in: [bidStatuses[0], bidStatuses[7]]};
        var query = AssetSaleBid.count(filter);
        query.exec(function (err, results) {
            return callback(err, results);
        });
    }

    function _getCountOnUser(callback) {
        var filter = {status: true};
        if (req.query.productId)
            filter['product.proData'] = req.query.productId;
        filter.bidStatus = {$in: [bidStatuses[0], bidStatuses[7]]};
        if (req.query.userId)
            filter.user = req.query.userId;
        var query = AssetSaleBid.count(filter);
        query.exec(function (err, results) {
            return callback(err, results);
        });
    }

};

exports.getMaxBidOnProduct = function (req, res) {
    var filter = {};
    filter.status = true;
    if (req.query.assetId)
        filter['product.assetId'] = req.query.assetId;
    if (req.query.userId)
        filter.user = req.query.userId;
    filter.offerStatus = offerStatuses[0];
    filter.bidStatus = {$in: [bidStatuses[0], bidStatuses[7]]};
    var query = AssetSaleBid.find(filter).sort({bidAmount: -1}).limit(1);
    query.exec(function (err, results) {
        if (err)
            return res.status(500).send(err);
        return res.status(201).json(results[0]);
    });
};

exports.getSellers = function (req, res, next) {
    var userType = req.body.userType || req.query.userType;
    var partnerId = req.body.partnerId || req.query.partnerId;
    var defaultPartner = req.body.defaultPartner || req.query.defaultPartner;
    var enterpriseId = req.body.enterpriseId || req.query.enterpriseId;
    if (enterpriseId)
        return getEnteriseUser();

    if (!userType || userType !== 'FA')
        return next();
    var users = [];
    async.parallel([getUsersAssociatedToEnterprise, getCustomer], function (err, result) {
        if (err) {
            console.log("error", err);
        }
        req.sellers = users;
        return next();
    });

    function getEnteriseUser() {
        req.sellers = [];
        User.find({enterpriseId: enterpriseId, deleted: false, status: true}, function (err, sellers) {
            if (err || !sellers.length) {
                return next();
            }
            sellers.forEach(function (item) {
                req.sellers.push(item._id + "")
            });
            next();
        })
    }

    function getUsersAssociatedToEnterprise(callback) {
        var filter = {};
        filter.deleted = false;
        filter.status = true;
        filter.enterprise = true;
        filter.role = "enterprise";
        filter.$or = [{FAPartnerId: partnerId}];
        if (defaultPartner === 'y')
            filter.$or[filter.$or.length] = {FAPartnerId: {$exists: false}};
        User.find(filter, function (err, enterprises) {
            if (err) {
                return callback("Error in getting user")
            }
            ;
            var entIds = [];
            if (!enterprises.length)
                return callback();

            enterprises.forEach(function (item) {
                entIds.push(item.enterpriseId);
            });
            User.find({enterpriseId: {$in: entIds}, deleted: false, status: true}, function (error, finalUsers) {
                if (err) {
                    return callback("Error in getting user")
                }
                ;
                finalUsers.forEach(function (user) {
                    users.push(user._id + "");
                })
                return callback();
            })
        });
    }

    function getCustomer(callback) {
        var filter = {};
        filter.deleted = false;
        filter.status = true;
        filter.$or = [{FAPartnerId: partnerId}];
        filter.role = {$in: ['customer', 'channelpartner']};
        if (defaultPartner === 'y')
            filter.$or[filter.$or.length] = {FAPartnerId: {$exists: false}};
        User.find(filter, function (err, finalUsers) {
            if (err) {
                return callback("Error in getting user")
            }
            ;
            finalUsers.forEach(function (item) {
                users.push(item._id + "");
            });
            return callback();
        });

    }
}

exports.getBidProduct = function (req, res, next) {
    if (req.body.userType === 'FA') {
        if (!req.sellers.length)
            return res.status(200).json({totalItems: 0, products: []});
        req.bidRequestApproved = true;
    }
    req.body.bidReceived = true;
    req.body.pagination = true;

    next();
}

exports.getProductsList = function (req, res, next) {
    if (req.query.productsWise === 'n')
        return next();

    req.productIds = [];
    var productFilter = {};
    productFilter.deleted = false;
    if (req.sellers && req.sellers.length)
        productFilter["seller._id"] = {$in: req.sellers};
    if (req.query.bidRequestApproved && req.query.bidRequestApproved === 'y')
        productFilter.bidRequestApproved = true;
    if (req.query.bidRequestApproved && req.query.bidRequestApproved === 'n')
        productFilter.bidRequestApproved = false;
    if (req.query.bidReceived)
        productFilter.bidReceived = true;
    Product.find(productFilter, function (err, proList) {
        if (err || !proList.length) {
            return next();
        }
        proList.forEach(function (item) {
            req.productIds.push(item._id);
        });
        next();
    })
}

exports.getApproverUserList = function (req, res, next) {
    req.approverUserList = [];
    var filter = {};
    filter.deleted = false;
    filter["role"] = {$in: ['admin','enterprise']};
    User.find(filter, function (err, users) {
        if (err || !users.length) {
            return next();
        }
        req.approverUser = {};
        users.forEach(function (item) {
            req.approverUser[item._id + ""] = item;
        });
        next();
    })
}

exports.exportExcel = function (req, res) {
	var filter = {};
	var user = req.user;
	var queryParam = req.query;
	var fieldsMap = {};
	if (!req.query.bidChanged)
		filter.bidChanged = false;

	if (req.query.actionable === 'y')
		filter.status = true;

	if (req.query.actionable === 'n')
		filter.status = false;

	if (queryParam.seller == 'y') {
		filter['product.seller._id'] = req.user._id + "";
		fieldsMap = fieldConfig['SELLER_FIELDS'];
	}

	if (queryParam.buyer == 'y') {
		filter.user = req.user._id + "";
		fieldsMap = fieldConfig['BUYER_FIELDS'];
	}

	if (queryParam.fa == 'y') {
		filter['product.seller._id'] = { $in: req.sellers || [] };
		fieldsMap = fieldConfig['FA_FIELDS'];
	};

	if (user.role == 'admin')
		fieldsMap = fieldConfig['ADMIN_FIELDS'];
	if (user.role == 'admin' && queryParam.payment === 'y') {
		fieldsMap = fieldConfig['EXPORT_PAYMENT'];
	}
	if (req.productIds)
		filter['product.proData'] = { $in: req.productIds || [] };

	if (queryParam.offerStatus)
		filter.offerStatus = queryParam.offerStatus;

	if (queryParam.dealStatuses)
		filter.dealStatus = { $in: queryParam.dealStatuses.split(',') };

	if (queryParam.bidStatus)
		filter.bidStatus = queryParam.bidStatus;
	if (req.sellers && req.sellers.length)
		filter['product.seller._id'] = { $in: req.sellers || [] };

	var query = AssetSaleBid.find(filter).populate('user product.proData');
	query.lean().exec(function (err, resList) {
		if (err) return handleError(res, err);
		if (queryParam.payment === 'y' && resList) {
			var jsonArr = [];
			resList.forEach(function (item, index) {
				if (item.emdPayment && item.emdPayment.paymentsDetail) {
					item.emdPayment.paymentsDetail.forEach(function (innerItem) {
						_formatPayments(item, innerItem, jsonArr);
					});
				}
				if (item.fullPayment && item.fullPayment.paymentsDetail) {
					item.fullPayment.paymentsDetail.forEach(function (innerItem) {
						_formatPayments(item, innerItem, jsonArr);
					});
				}
			});
			resList = [];
			if (jsonArr.length > 0) {
				resList = jsonArr.slice();
			}
		}
		renderExcel(res, resList);
	});

	function renderExcel(res, resList) {
		var dataArr = [];
		var headers = Object.keys(fieldsMap);

		/* removing items from csv in case of Pending for Approval
			* Madhusudan Mishra
		*/
		if(queryParam.reportType === 'Pending_For_Approval') {
			removeItmByHeaders(['EMD Due Date/Time','Full Payment Due Date/Time']);
		}

		function removeItmByHeaders(itmes) {
			itmes.forEach(function(item) {
				var index = headers.indexOf(item);
				headers.splice(index, 1);
			})
		}

		/* update headers in case of pending for Approcal csv  */
		var csvStr = "";
		csvStr += headers.join(',');
		csvStr += "\r\n";

		resList.forEach(function (item, idx) {
			dataArr = [];
			headers.forEach(function (header) {
				var keyObj = fieldsMap[header];
				var val = _.get(item, keyObj.key, "");
				if (keyObj.type && keyObj.type == 'boolean')
					val = val ? 'YES' : 'NO';
				if (keyObj.key && keyObj.key == 'proxyBid' && item.auctionType) {
                                    if (item.auctionType==='PT')
                                        var aucType = ' (Private Treaty)';
                                    if (item.auctionType==='A')
                                        var aucType = ' (On-Line Auction)';
                                    if (item.auctionType==='L')
                                        var aucType = ' (Live Auction)';
                                    val = val ? 'YES' + aucType : 'NO' + aucType;
                                }
				if (keyObj.type && keyObj.type == 'date' && val)
					val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
				if (keyObj.type && keyObj.type == 'datetime' && val)
					val = moment(val).utcOffset('+0530').format('hh:mm a');
				if (keyObj.key && keyObj.key == 'assessedValue' && item.product.proData && item.product.proData.valuationAssessedValue)
                    val = item.product.proData.valuationAssessedValue;
                if (keyObj.key && keyObj.key == 'overallGeneralCondition' && item.product.proData && item.product.proData.valuationOverallGeneralCondition)
                    val = item.product.proData.valuationOverallGeneralCondition;

                /* 
				* change date format for Emd Due Date And Full Payment Date
                */
                if(keyObj.key === 'emdEndDate' && item.emdEndDate)
                	val = moment(item.emdEndDate).utcOffset('+0530').format('MM/DD/YYYY')+' at ' + moment(item.emdEndDate).utcOffset('+0530').format('hh:mm a');
                if(keyObj.key === 'fullPaymentEndDate' && item.fullPaymentEndDate)
                	val = moment(item.fullPaymentEndDate).utcOffset('+0530').format('MM/DD/YYYY')+' at ' + moment(item.fullPaymentEndDate).utcOffset('+0530').format('hh:mm a');

                /*
					Added by Madhusudan Mishra
                */

				if (keyObj.key && (keyObj.key === 'approvedBy' || keyObj.key === 'approvalDate' || keyObj.key === 'approvalTime') && item.bidStatuses.length > 0) {
                    var tempArr = [];
					for (var i = item.bidStatuses.length - 1; i > 0; i--) {
						if (item.bidStatuses[i].status === bidStatuses[7]) {
                            tempArr.push(item.bidStatuses[i]);
						}
					}
                    var itemObj = {};
                    if(tempArr.length === 1) {
                        itemObj = tempArr[0];
                    } else if(tempArr.length > 1) {
                        itemObj = tempArr[1];
                    }
                    if(Object.keys(itemObj).length > 0) {
                        if (keyObj.key === 'approvedBy') {
                            if (itemObj.userId === 'SYSTEM' || itemObj.userId + "" === item.user._id + "")
                                val = 'System';
                            else if (itemObj.fname && itemObj.lname)
                                val = itemObj.fname + " " + itemObj.lname;
                            else if (item.product && item.product.seller && itemObj.userId + "" === item.product.seller._id + "")
                                val = item.product.seller.name;
                            else {
                                var approverObj = req.approverUser[itemObj.userId + ""];
                                if(approverObj && approverObj.fname)
                                    val = (approverObj.fname) + " " + (approverObj.lname);
                                else
                                    val = "";
                            }
                        } else if (keyObj.key === 'approvalDate')
                            val = moment(itemObj.createdAt).utcOffset('+0530').format('MM/DD/YYYY');
                        else
                            val = moment(itemObj.createdAt).utcOffset('+0530').format('hh:mm a');
                    }
				}

				if (keyObj.key && keyObj.key === 'bidStatusUpdateBy' && item.bidStatuses.length > 0) {
                    var bidObj = item.bidStatuses[item.bidStatuses.length - 1];
					if (bidObj.userId === 'SYSTEM')
						val = 'System';
                    else if (bidObj.fname && bidObj.lname && bidObj.userId + "" !== item.user._id + "")
                        val = bidObj.fname + " " + bidObj.lname;
                    else if (bidObj.userId + "" === item.user._id + "")
                        val = "";
					else if (item.product && item.product.seller && bidObj.userId + "" === item.product.seller._id + "")
						val = item.product.seller.name;
					else {
                            var approverObj = req.approverUser[bidObj.userId + ""];
                            if(approverObj && approverObj.fname)
                                val = (approverObj.fname) + " " + (approverObj.lname);
                            else
                                val = "";
                        }
                }

				if (keyObj.key && keyObj.key === 'dealStatusUpdatedBy' && item.dealStatuses.length > 0) {
                    var dealObj = item.dealStatuses[item.dealStatuses.length - 1];
					if (dealObj.userId === 'SYSTEM')
						val = 'System';
                    else if (dealObj.fname && dealObj.lname && dealObj.userId + "" !== item.user._id + "")
                        val = dealObj.fname + " " + dealObj.lname;
                    else if (dealObj.userId + "" === item.user._id + "")
                        val = "";
					else if (item.product && item.product.seller && dealObj.userId + "" === item.product.seller._id + "")
						val = item.product.seller.name;
					else {
                            var approverObj = req.approverUser[dealObj.userId + ""];
                            if(approverObj && approverObj.fname)
                                val = (approverObj.fname) + " " + (approverObj.lname);
                            else
                                val = "";
                        }
                }

				if (keyObj.key && keyObj.key === 'sellerCustomerId' && item.user)
					val = item.product.seller.customerId;

				if (keyObj.key && keyObj.key === 'buyerCustomerId' && item.user)
					val = item.user.customerId;

				if (keyObj.key && keyObj.key === 'buyerName' && item.user)
					val = item.user.fname + " " + item.user.lname;
				if (keyObj.key && keyObj.key == 'fullPaymentAmount')
					val = item.fullPaymentAmount;

				if (keyObj.key && keyObj.key === 'emdReceived') {
					val = 'No';
					for (var i = 0; i < item.dealStatuses.length; i++) {
						if (item.dealStatuses[i].status === dealStatuses[7]) {
							val = 'Yes';
							break;
						}
					}
				}

				if (keyObj.key && keyObj.key === 'fullPayment') {
					val = 'No';
					for (var i = 0; i < item.dealStatuses.length; i++) {
						if (item.dealStatuses[i].status === dealStatuses[8]) {
							val = 'Yes';
							break;
						}
					}
				}

				if (keyObj.key && keyObj.key === 'totalAmountReceive') {
					val = (item.fullPaymentAmount + item.emdAmount) - (item.fullPayment.remainingPayment + item.emdPayment.remainingPayment);
				}

				if (keyObj.type && keyObj.type == 'url' && val) {
					if (val.filename)
						val = req.protocol + "://" + req.headers.host + "/download/" + item.assetDir + "/" + val.filename || "";
					else
						val = "";
				}
				dataArr.push(Utility.toCsvValue(val));
			});
			csvStr += dataArr.join(",");
			csvStr += "\r\n";
		});
		Utility.renderCSV(res, csvStr);
	}

}

function _formatPayments(item, innerItem, jsonArr) {
    var obj = {};
    obj['ticketId'] = item.ticketId || "";
    obj['assetId'] = item.product.assetId || "";
    obj['assetName'] = item.product.name || "";
    if (item.user) {
        obj['customerId'] = item.user.customerId + " " + item.user.customerId || "";
        obj['buyerName'] = item.user.fname + " " + item.user.lname || "";
        obj['buyerMobile'] = item.user.mobile || "";
        obj['buyerEmail'] = item.user.email || "";
    }
    obj['paymentMode'] = innerItem.paymentMode || "";
    obj['bankName'] = innerItem.bankName || "";
    obj['instrumentNo'] = innerItem.instrumentNo || "";
    obj['amount'] = innerItem.amount || 0;
    obj['paymentDate'] = innerItem.paymentDate || "";
    obj['createdAt'] = innerItem.createdAt || "";
    jsonArr.push(obj);
}

function handleError(res, err) {
    return res.status(500).send(err);
}