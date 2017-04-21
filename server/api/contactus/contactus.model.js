'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ContactUsSchema = new Schema({
  ticketId : String,
  name: String,
  email: String,
  country: String,
  mobile: String,
  message: String,
  createdAt:Date
});

ContactUsSchema.pre('save',function(next){
	var self = this;
	var prefix = 'CUS';
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+seqnum;
		return next();
	},'contactus',100002);

})

module.exports = mongoose.model('ContactUs', ContactUsSchema);