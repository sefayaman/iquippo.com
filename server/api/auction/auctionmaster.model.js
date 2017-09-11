'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//var timestamp=require('unix-timestamp');

var AuctionMasterSchema = new Schema({
	name:String,
	startDate:Date,
	auctionId:String,
	sellerAuction:String,
	certification:String,
	paymentstatus:String,
	endDate:Date,
	auctionOwner: String,
	auctionOwnerMobile:String,
	insStartDate: Date,
	insEndDate: Date,
	regEndDate: Date,
	city: String,
	state: String,
	auctionAddr: String,
	auctionType: String,
	regCharges : Number,
	emdAmount : Number,
	primaryImg: String,
	emdTax:String,
	factorCreditlimit:Number,
	taxApplicability:String,
	bidIncrement:Number,
	lastMinuteBid:Number,
	extendedTo:Number,
	contactName:String,
	contactNumber:String,
	allowBid:String,
	termAuction:String,
	docType:String,
	docName: String,
	docNameProxy: String,
	groupId:String,
	createdAt: {type:Date,default:Date.now},
	updatedAt: {type:Date,default:Date.now},
});

module.exports = mongoose.model('AuctionMaster', AuctionMasterSchema);