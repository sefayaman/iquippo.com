'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//var timestamp=require('unix-timestamp');

var AuctionMasterSchema = new Schema({
	name:String,
	startDate:Date,
	auctionId:String,
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
	static_increment:Number,
	bidIncrement:Object,
	lastMinuteBid:Number,
	extendedTo:Number,
	status:{type:Boolean,default:true},
	isDeleted:{type:Boolean,default:false},
	contactName:String,
	contactNumber:String,
	allowBid:String,
	termAuction:String,
	docType:String,
	docName: String,
	docNameProxy: String,
	groupId:String,
	reqSubmitStatus:{type:String,default:"Request Failed"},
	createdAt: {type:Date,default:Date.now},
	updatedAt: {type:Date,default:Date.now},
});

module.exports = mongoose.model('AuctionMaster', AuctionMasterSchema);