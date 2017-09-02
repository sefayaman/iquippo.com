'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//var timestamp=require('unix-timestamp');

var FinanceMasterSchema = new Schema({
	type:String,
	image: String,
	url:String,
	startDate:{type:Date},
	endDate:{type:Date},
	createdAt: {type:Date,default:Date.now},
	updatedAt: {type:Date,default:Date.now},
});

module.exports = mongoose.model('FinanceMaster', FinanceMasterSchema);