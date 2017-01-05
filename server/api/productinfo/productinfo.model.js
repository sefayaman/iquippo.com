'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var ProductInfo = new Schema({
	user: {},
	type: String, //AA:here type is technical,others etc....
	information : {},
	status : Boolean,	
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});



ProductInfo.pre('save', function(next) {
	// get the current date
	var currentDate = new Date();

	// change the updated_at field to current date
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt)
		this.createdAt = currentDate;

	next();
});

module.exports = mongoose.model('ProductInfo', ProductInfo);