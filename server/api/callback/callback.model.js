'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CallbackSchema = new Schema({
  fname: String,
  mname: String,
  lname: String,
  phone: String,
  mobile: String,
  email: String,
  ticketId : String,
  createdAt: Date
});

CallbackSchema.pre('save',function(next){
	var self = this;
	var prefix = 'CB';
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+seqnum;
		return next();
	},'callbacks',100002);

})

module.exports = mongoose.model('Callback', CallbackSchema);