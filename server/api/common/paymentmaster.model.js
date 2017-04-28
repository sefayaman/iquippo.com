'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PaymentMasterSchema = new Schema({
	serviceName:String,
	serviceCode:String,
	partnerId:String,
	fees:Number,
	createdById:String,
	default:{type:Boolean,default:false},
	createdAt: {type:Date,default:Date.now},
	updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('PaymentMaster', PaymentMasterSchema);