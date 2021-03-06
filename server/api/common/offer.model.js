'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OfferSchema = new Schema({
        category: {},
        brand: {},
        model: {},
        country:{type:String,default:'India'},
        location: [{
            id:{type:Schema.Types.ObjectId,ref:'State'},
            name:String
        }],
        cash_purchase: {type:Boolean,default:false},  
        caseInfo: [],
        finance: {type:Boolean,default:false},
        financeInfo:[],
        leaseInfo:[],
        lease: {type:Boolean,default:false},
        createdBy:{},
        forAll:{type:Boolean,default:false},  
        status: {type:Boolean,default:true},  
        createdAt: {type:Date,default:Date.now},
        updatedAt: {type:Date,default:Date.now}
});

module.exports = mongoose.model('Offer', OfferSchema);