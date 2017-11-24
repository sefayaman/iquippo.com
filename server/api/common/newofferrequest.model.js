'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OfferRequestSchema = new Schema({
        category: {},
        brand: {},
        model: {},
        state:String, 
        cashOffer: [],
        financeOffer:[],
        leaseOffer:[],
        user:{},  
        status: {type:Boolean,default:true},  
        createdAt: {type:Date,default:Date.now},
        updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('NewOfferRequest', OfferRequestSchema);