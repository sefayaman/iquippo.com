'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AuctionMasterSchema = new Schema({
	name:String,
	startDate:Date,
	auctionId:String,
	endDate:Date,
	groupId:String,
	createdAt: {type:Date,default:Date.now},
	updatedAt: {type:Date,default:Date.now},
});

module.exports = mongoose.model('AuctionMaster', AuctionMasterSchema);