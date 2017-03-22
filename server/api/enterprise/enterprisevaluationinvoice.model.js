// 'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseValuationInvoiceSchema = new Schema({
  requestType:String,
  invoiceNo:String,
  serviceFee:Number,
  taxRate:Number,
  chargeBasis:String,
  requestCount:Number,
  enterprise:{},
  agency:{},
  invoiceAmount:Number,
  paymentReceivedDetail:{
    remainingAmount:Number,
    paymentDetails :[]
  },
  paymentMadeDetail:{
    remainingAmount:Number,
    paymentDetails :[]
  },
  status:String,
  statuses:[],
  createdBy:{},
  paymentReceived:{type:Boolean,default:false},
  paymentMade:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

EnterpriseValuationInvoiceSchema.pre('save',function(next){
  var self = this;
  var prefix = 'EVRINV';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.invoiceNo = prefix+seqnum;
    return next();
  },'EnterpriseValuationInvoice',100002);

})

module.exports = mongoose.model('EnterpriseValuationInvoice', EnterpriseValuationInvoiceSchema);

