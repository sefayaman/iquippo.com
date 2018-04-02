'use strict';
var config = require('./../../config/environment');
var commonController = require('./../common/common.controller');
var notification = require('./../../components/notification.js');
var ValuationReq = require('./valuation.model');
var Utility = require('./../../components/utility.js');
var moment = require('moment');
var TimeInterval = 10;

exports.sendNotification = function(valReq){
	if(!valReq.requestId || !valReq.action)
		return;

    var query = ValuationReq.find({requestId:valReq.requestId}).populate("transactionIdRef");
    query.lean().exec(function(err,indReq){
    	if(err || !indReq.length)
			return;
		var tplData = indReq[0];
		var tplName = "";
		var subject = "";
		var emailData = {};
		emailData.notificationType = "email";
		switch(valReq.action){
			case 'REQUEST':
				tplName = "valuationCustomerEmail";
				emailData.subject = "Request for " + tplData.requestType + " received: " + tplData.requestId;
 				if(tplData.user && tplData.user.email) {
					emailData.to = tplData.user.email;
					sendEmail(tplData,emailData,tplName);
				}
				setTimeout(function () { 
					if(tplData.user && tplData.user.mobile) {
						tplName = "valuationCustomerSms";
						emailData.to = tplData.user.mobile;
						emailData.countryCode = tplData.user.countryCode;
						emailData.notificationType = "sms";
					 	sendEmail(tplData,emailData,tplName);
					} 
				},TimeInterval);
				break;
			case 'PAYMENT':
				tplName = "valuationPaymentCustomerEmail";
				emailData.subject = "Payment received for your " + tplData.requestType + " request: " + tplData.requestId;
				tplData.paymentDetails = {};
				if(tplData.transactionIdRef.payments.length > 0) {
					tplData.paymentDetails = tplData.transactionIdRef.payments[0];
					tplData.paymentDetails.paymentDate = moment(tplData.transactionIdRef.payments[0].createdAt).utcOffset('+0530').format('MM/DD/YYYY');
					tplData.paymentDetails.paymentMode = tplData.transactionIdRef.paymentMode === 'online' ? "Online" : 'Offline';
				}
				if(tplData.user && tplData.user.email) {
					emailData.to = tplData.user.email;
					sendEmail(tplData,emailData,tplName);
				}
				break;
			case 'AGENCY':
				tplName = "valuationAgencyEmail";
				emailData.subject = "Request for Individual " + tplData.requestType + " received: " + tplData.requestId;
				if(tplData.valuationAgency && tplData.valuationAgency.email) {
					emailData.to = tplData.valuationAgency.email;
					sendEmail(tplData,emailData,tplName);
				}
				break;
			case 'REPORT':
				tplName = "individualValuationReportsEmailToCustomer";
				emailData.subject = "Your " + tplData.requestType + " report is available to view: " + tplData.requestId;
				if(tplData.valuationReport && tplData.valuationReport.filename)
	              tplData.reportUrl = tplData.valuationReport.filename;
	            
				if(tplData.user && tplData.user.email) {
					emailData.to = tplData.user.email;
					sendEmail(tplData,emailData,tplName);
				}
				setTimeout(function () { 
					if(tplData.user && tplData.user.mobile) {
						tplName = "individualValuationReportsSMSToCustomer";
						emailData.to = tplData.user.mobile;
						emailData.countryCode = tplData.user.countryCode;
						emailData.notificationType = "sms";
						sendEmail(tplData,emailData,tplName);
					}
				},TimeInterval);
				break;
			case 'INVOICE':
				tplName = "valuationInvoiceEmailToCustomer";
				emailData.subject = "Invoice generated for your " + tplData.requestType + " request: " + tplData.requestId;
				tplData.showPaymentLink = false;
				if(tplData.transactionIdRef.payments.length === 0)
					tplData.showPaymentLink = true;
				if(tplData.user && tplData.user.email) {
					emailData.to = tplData.user.email;
					sendEmail(tplData,emailData,tplName);
				}
				setTimeout(function () {
					if(tplData.user && tplData.user.mobile) {
						tplName = "valuationInvoiceSmsToCustomer";
						emailData.to = tplData.user.mobile;
						emailData.countryCode = tplData.user.countryCode;
						emailData.notificationType = "sms";
						sendEmail(tplData,emailData,tplName);
					}
				},TimeInterval);
				break;
		}
    });
  }

	function sendEmail(tplData,emailData,tplName) {
		commonController.compileTemplate(tplData, config.serverPath, tplName, function(success,retData){
		if(success){
			emailData.content =  retData;
			notification.pushNotification(emailData);
		}
	});
	}		


