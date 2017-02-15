'use strict';

var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NegotiationSchema = new Schema({
  user: {},
  product : {},
  type:String,
  offer:Number,
  negotiation:String,
  ticketId : String,
  createdAt: {type:Date,default:Date.now}
});

NegotiationSchema.pre('save',function(next){
	var self = this;
	var type = self.type;
	var prefix = '';

	switch(type){
		case 'BUY_NEGOTIATE' :
			prefix = 'SB'
			break;
		case 'FOR_RENT' : 
			prefix = 'GN'
			break;
		case 'BUY' : 
			prefix = 'BN'
			break;
	}
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+seqnum;
		return next();
	},'negotiations',100002);

})

module.exports = mongoose.model('Negotiation', NegotiationSchema);