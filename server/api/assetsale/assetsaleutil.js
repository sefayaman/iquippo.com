'use strict';
var async = require("async");
var SaleProcessMaster= require('../common/saleprocessmaster.model');
var User = require('../user/user.model');
var MarkupPrice = require('../common/markupprice.model');
var EMDMaster = require('../common/emdcharge.model');
var config = require('./../../config/environment');
var commonController = require('./../common/common.controller');
var notification = require('./../../components/notification.js');
var AssetSaleBid = require('./assetsalebid.model');
var Utility = require('./../../components/utility.js');
var Event = require("../common/event.model");
var _ = require("lodash");
/*
* For enterprise master filter must be like {}
*/

exports.setStatus = function(bid,status,statusField,historyField,user){ 
        bid[statusField] = status;
        var stsObj = {};
        stsObj.status = status;
        if(user) {
			stsObj.userId = user._id;
	        stsObj.fname = user.fname;
	        stsObj.lname = user.lname;
	        stsObj.mobile = user.mobile;
	        stsObj.customerId = user.customerId;
	        stsObj.role = user.role;
        } else
        stsObj.userId = "SYSTEM";
        stsObj.createdAt = new Date();
        if(!bid[historyField])
          bid[historyField] = [];
        bid[historyField].push(stsObj);
 }
 
exports.getMasterBasedOnUser = function(userId,filter,type, callback) {
	
	User.find({_id:userId,status:true,deleted:false}).exec(function(err, users){
	    if (err || !users.length)
			return callback("User not found");
		var user = users[0];
	    switch (user.role) {
	    	case "enterprise" : 
	    			filter.enterpriseId = user.enterpriseId;
	    			break;
	    	case "channelpartner" : 
	    	case "customer" : 
	    			filter['user.userId'] = user._id;
	    			break;
	    }

	    switch(type){
	    	case 'saleprocessmaster':
	    		getValueFromSaleProcessMaster(filter,callback);
	    	break;
	    	case 'markup':
	    		getMarkupPrice(filter,callback);
	    	break;
	    	case 'assetsalecharge':
	    	break;
	    	case 'emdmaster':
	    		getEmdFromMaster(filter,callback);
	    	break;


	    }
	});
}

exports.getMarkupOnSellerMobile = function(mobile,cb){
	var filter = {};
	filter['user.mobile'] = mobile;
	getMarkupPrice(filter,cb);

}
function getMarkupPrice(filter, callback) {
	var query = MarkupPrice.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			filter = {};
			filter.userRole = "default";
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

function getValueFromSaleProcessMaster(filter, callback) {
	var query = SaleProcessMaster.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			var filterObj = {};
			filterObj.userRole = "default";
			var query = SaleProcessMaster.find(filterObj);
			query.exec(function(err, periods) {
				if (err || !periods.length)
					return callback(err);
				return callback(null, periods[0]);
			});
		} else {
			return callback(null, result[0]);
		}
	});
}

function getEmdFromMaster(filter, callback) {
	async.parallel({emd:getEMD,defaultEMD:getDefaultEMD},function(err,result){
		if(err) return callback(err);
		if(result.emd)
			return callback(null, result.emd);
		else if(result.defaultEMD)
			return callback(null, result.defaultEMD);
		else
			return callback(null, null);
	});

	function getEMD(callback){
		var tempFilter = {};
		if(filter.enterpriseId)
			tempFilter.enterpriseId = filter.enterpriseId;
		if(filter['user.userId'])
			tempFilter['user.userId'] = filter['user.userId'];
		
		var query = EMDMaster.find(filter);
		query.exec(function(err, result) {
			if (err)
				return callback(err);
			if(result.length === 0) {
				tempFilter['category.name'] = "All";
				var query = EMDMaster.find(tempFilter);
				query.exec(function(err, emdcharge) {
					if (err || !emdcharge.length)
						return callback(err);
					if(emdcharge.length > 0)
						return callback(null, emdcharge[0]);
					else
						return callback(null, null);
				});
			} else {
					return callback(null, result[0]);
			}
		});
	}

	function getDefaultEMD(callback){
		var filterObj = {};
		filterObj.userRole = "default";
		var query = EMDMaster.find(filterObj);
		query.exec(function(err, emdcharge) {
			if (err || !emdcharge.length)
				return callback(err);
			if(emdcharge.length)
				return callback(null, emdcharge[0]);
			else
				return callback(null, null);
		});
	}
}

exports.sendNotification = function(bidArr){
    if(!bidArr.length)
		return;
    async.eachLimit(bidArr,5,initialize,function(err){
    	if(err)
			console.log("error in sending mail for buy sale",err);
    });

	function initialize(bid,callback){
		if(!bid.ticketId || !bid.action)
			return callback("Invalid bid");

	    var query = AssetSaleBid.find({ticketId:bid.ticketId}).populate("user product.proData");
	    query.lean().exec(function(err,bids){
			if(err || !bids.length)
				return callback(err);
			var tplData = bids[0];
			delete tplData._id;
			var tplName = "";
			var subject = "";
			switch(bid.action){
				case 'BUYNOW':
					tplName = "BuynowRequestEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Buy Now Request Received for " + tplData.product.name;
					break;
				case 'BIDREQUEST':
					tplName = "BidRequestEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Bid Request Received for " + tplData.product.name;
					break;
				case 'OFFERREJECTED':
					tplName = "OfferRejectedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your offer for " + tplData.product.name + " has been Rejected.";
					break;
				case 'APPROVE':
					tplName = "OfferApprovedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your offer for " + tplData.product.name + " has been Approved.";
					if(tplData.emdEndDate)
						tplData.emdDueDate = Utility.toIST(tplData.emdEndDate);
					break;
				case 'EMDPAYMENT':
					var totalPaidAmount = 0;
					tplData.emdPayment.paymentsDetail.forEach(function(item) {
		                totalPaidAmount = totalPaidAmount + item.amount;
		            });
		            tplData.totalAtEMDPayment = totalPaidAmount;
					tplName = "EMDReceivedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your Earnest Money Deposit (EMD) for " + tplData.product.name + " has been Received.";
					if(tplData.fullPaymentEndDate)
						tplData.fullpaymentDueDate = Utility.toIST(tplData.fullPaymentEndDate);
					break;
				case 'FULLPAYMENT':
					var totalPaidAmount = 0;
					tplData.fullPayment.paymentsDetail.forEach(function(item) {
		                totalPaidAmount = totalPaidAmount + item.amount;
		            });
		            if(totalPaidAmount <= 0) {
		            	tplData.emdPayment.paymentsDetail.forEach(function(item) {
			                totalPaidAmount = totalPaidAmount + item.amount;
			            });
		            }
                            tplData.totalAtEMDPayment = totalPaidAmount;
					tplName = "FullpaymentReceivedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your Full Payment for " + tplData.product.name + " has been Received.";
					break;
				case 'EMDFAILED':
					tplName = "EMDFailedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your request for " + tplData.product.name + " has been Cancelled.";
					break;
				case 'FULLPAYMENTFAILED':
					tplName = "FullpaymentFailedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your request for " + tplData.product.name + " has been Cancelled.";
					break;
				case 'DOISSUED':
					tplName = "DOIssuedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your Delivery Order (DO) for " + tplData.product.name + " has been generated.";
					break;
				case 'BIDREJECTED':
					tplName = "BidRejectedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your Bid for " + tplData.product.name + " has been rejected.";
					break;
				case 'BIDCHANGED':
					tplName = "BidChangedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": You have revised your Bid for " + tplData.product.name;
					break;
				case 'BIDWITHDRAW':
					tplName = "BidWithdrawEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your Bid for " + tplData.product.name + " has been Withdrawn.";
					break;
				case 'CLOSED':
					tplName = "BidClosedEmailToBuyer";
					subject = "Ticket ID- " + tplData.ticketId +": Your request for " + tplData.product.name + " has been successfully completed.";
					break;
			}
			if(!tplName)
				return callback("Invalid Action");

			var emailData = {};
			emailData.subject = subject;
			if(!tplData.user || !tplData.user.email)
				return callback();
			emailData.to = tplData.user.email;
			emailData.notificationType = "email";
			sendEmail(tplData,emailData,tplName,callback);
	    });
	}
  }

	function sendEmail(tplData,emailData,tplName,cb) {
		commonController.compileTemplate(tplData, config.serverPath, tplName, function(success,retData){
		if(success){
			emailData.content =  retData;
			notification.pushNotification(emailData);
		}
		if(cb)
			cb();
		});
	}

/*function getEmdFromMaster(filter, callback) {
	var query = EMDMaster.find(filter);
	query.exec(function(err, result) {
		if (err)
			return callback(err);
		if(result.length == 0) {
			var filterObj = {};
			filterObj.userRole = "Other";
			var query = EMDMaster.find(filterObj);
			query.exec(function(err, emdcharge) {
				if (err || !emdcharge.length)
					return callback(err);
				
				return callback(null, emdcharge[0]);
			});
		} else {
			return callback(null, result[0]);
		}
	});
}*/

exports.checkHolidayExistAndAdd = function (startDate, endDate, timePeriod, cb) {
	var sdt = startDate;
	var edt = endDate;

	Event.find().sort({ start: 1 }).lean().exec(function (err, events) {
		if (!err && events) {

			var eventCollections = [];
			var arr = _.cloneDeep(events);

			arr.forEach(function (item, key) {
				if (item.start < item.end) {

					while (item.start <= item.end) {
						eventCollections.push(_.clone(item.start));
						item.start.addDays(1);
					}
				} else {
					eventCollections.push(item.start);
				}
			});
			console.log(eventCollections);

			edt = __check(sdt, timePeriod, eventCollections);

		}

		return cb(null, edt);
	});
}

function __check(startDate, timePeriod, holidays) {
	console.log('CHECKING...', timePeriod, '---', startDate);
	var today = startDate;
	var nextDay = today;
	var i = 0;

	while (i < timePeriod) {
		nextDay.addDays(1);
		if (!holidays.contains(nextDay)) {
			i++;
		}

	}
	console.log('NEXT DAY -- ', nextDay.toString());
	return nextDay;
}

Array.prototype.contains = function (item) {
	var i;
	for (i in this) {
		var dt = new Date(this[i]);
		if (dt.getDate() == item.getDate() && dt.getMonth() == item.getMonth() && dt.getFullYear() == item.getFullYear()) {
			return true;
		}
	}
	return false;
}



