'use strict';
var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OfferRequestSchema = new Schema({
        orderId : String,
        fname:String,
        lname:String,
        mobile:String,
        email:String,
        category: {},
        brand: {},
        model: {},
        state:String,
        assetId:String,
        assetDir:String,
        primaryImg:String,
        productName:String,
        cashOffer: [],
        financeOffer:[],
        leaseOffer:[],
        isForSelf:{type:Boolean,default:true},
        user:{},  
        status: {type:Boolean,default:true},  
        createdAt: {type:Date,default:Date.now},
        updatedAt: {type:Date,default:Date.now}
});

OfferRequestSchema.pre('save',function(next){
  var self = this;
  var prefix = 'ER';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.orderId = prefix + seqnum;
    return next();
  },'NewOfferRequest',"100002");

});
module.exports = mongoose.model('NewOfferRequest', OfferRequestSchema);