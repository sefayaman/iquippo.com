'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OfferSchema = new Schema({
        category: {},
        brand: {},
        model: {},
        location: String,
        cash_purchase: {type:Boolean,default:false},  
        caseInfo: {},
        finance: {type:Boolean,default:false},
        financeInfo:[],
        leaseInfo:{},
        //tenure: String,
       // rate: String,
       // margin: String,
        //processingfee: String,
        //installment: String,
        //freecost: String, 
        lease: {type:Boolean,default:false},
        createdBy:{},  
        createdAt: {type:Date,default:Date.now},
        updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Offer', OfferSchema);