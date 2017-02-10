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
			prefix = 'SQ_';
			break;
		case 'valuation' :
			prefix = 'VQ_';
			break;
		case 'finance' :
			prefix = 'FQ_';
			break;
		case 'insurance' :
			prefix = 'IQ_';
			break;
	}

	prefix = prefix + self.quote.mobile;
	console.log(prefix);
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+'_'+seqnum;
		return next();
	},'serviceenquiries',100002);

})

module.exports = mongoose.model('ServiceEnquiry', ServiceEnquirySchema);