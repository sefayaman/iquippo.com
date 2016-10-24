'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;



// var messageSubschema = new mongoose.Schema({
//     mess_id: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'message'
//     }
// },{ _id : false });

var replySchema = new Schema({
	from: {type: String, required: true},
	reply: {type: String, required: true},
	to: [ {type: String, required: true} ]
}, {timestamps: true});


var messageSchema = new Schema({
	from: {type: String, required: true},	
	to: [ {type: String, required: true} ],	
	subject: String,
	message: {type: String, required: true},
	replies: [replySchema]
}, {timestamps: true});

module.exports = mongoose.model('Message', messageSchema);
