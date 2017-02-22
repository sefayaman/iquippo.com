'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UploadRequestSchema = new Schema({
	user: {},
	type: String, //AA:here type is the upload request type i.e. auction,product etc....
	status: {
		type: String,
		default: "Request Submitted"
	},
	product : {},
	auction :{},
	contact : {},
	invoice : {},
	statuses: [{}],
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	lotNo : String,
	createdBy: String,
	isInserted: {
		type: Boolean,
		default: 0
	},
	spareUploads : {}
});


// on every save, add the date
UploadRequestSchema.pre('save', function(next) {
	// get the current date
	var currentDate = new Date();

	// change the updated_at field to current date
	this.updatedAt = currentDate;

	// if created_at doesn't exist, add to that field
	if (!this.createdAt)
		this.createdAt = currentDate;

	next();
});

module.exports = mongoose.model('UploadRequestSchema', UploadRequestSchema);