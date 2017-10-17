'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InputFormMasterSchema = new Schema({
	category:{
			categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
			name:String
			},
	brand:{
			brandId:{type:Schema.Types.ObjectId,ref:'Category'},
			name:String
			},
	model:{
			modelId:{type:Schema.Types.ObjectId,ref:'Category'},
			name:String
			},
  	additionalInfo:[{}],
	status:{type:String,default:"active"},
	createdAt: {type:Date,default:Date.now},
	updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('InputFormMaster', InputFormMasterSchema);