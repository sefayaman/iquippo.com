'use strict';

var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceEnquirySchema = new Schema({
  type : String,
  quote : {},
  ticketId : String,
  createdAt: {type:Date,default:Date.now}
});

ServiceEnquirySchema.pre('save',function(next){
	var self = this;
	var type = self.type;
	var prefix = '';
	switch(type){
		case 'shipping' :
			prefix = 'SQ';
			break;
		case 'valuation' :
			prefix = 'VQ';
			break;
		case 'finance' :
			prefix = 'FQ';
			break;
		case 'insurance' :
			prefix = 'IQ';
			break;
	}
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+seqnum;
		return next();
	},'serviceenquiries',100002);

})

module.exports = mongoose.model('ServiceEnquiry', ServiceEnquirySchema);