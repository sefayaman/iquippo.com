'use strict';
var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var NewEquipmentBulkOrderSchema = new Schema({
	orderId:String,
	groupId:String,
	name: String,
	mobile:String,
	email:String,
	country:String,
	state: String,
	city: String,
	orders:[{}],
	forSelf:{type:Boolean,default:true},
	user:{},
	createdAt: {type:Date,default:Date.now},
  	updatedAt: {type:Date,default:Date.now}
	
});

NewEquipmentBulkOrderSchema.pre('save',function(next){
  var self = this;
  var prefix = 'BR';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
  	self.groupId = prefix + seqnum;
    return next();
  },'BulkRequest',"100002");

});

module.exports = mongoose.model('NewEquipmentBulkOrder', NewEquipmentBulkOrderSchema);