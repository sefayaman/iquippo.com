'use strict';

var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ServiceRequesetSchema = new Schema({
  type : String,
  user : {},
  product : {},
  request : {},
  ticketId : String,
  createdAt: {type:Date,default:Date.now}
});

ServiceRequesetSchema.pre('save',function(next){
	var self = this;
	var type = self.type;
	var prefix = '';

	switch(type){
		case 'EASY_FINANCE' :
			prefix = 'EF'
			break;
		case 'INSPECTION_REQUEST' : 
			prefix = 'IR'
			break;
	}
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+seqnum;
		return next();
	},'servicerequesets',100002);

})


module.exports = mongoose.model('ServiceRequeset', ServiceRequesetSchema);