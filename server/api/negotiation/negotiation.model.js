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
			prefix = 'SM-BN_'
			break;
		case 'FOR_RENT' : 
			prefix = 'SM-FR_'
			break;
		case 'BUY' : 
			prefix = 'SM-FB_'
			break;
	}
	prefix = prefix + self.user.mobile;
	var sequence = seqGenerator.sequence();
	sequence.next(function(seqnum){
		self.ticketId = prefix+'_'+seqnum;
		return next();
	},'negotiations',100002);

})

module.exports = mongoose.model('Negotiation', NegotiationSchema);