// 'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseValuationInvoiceSchema = new Schema({
  requestType:String,
  invoiceNo:String,
  referenceNo:String,
  uniqueControlNos:[],
  serviceFee:{type:Number,default:0},
  selectedTaxes:[],
  chargeBasis:String,
  requestCount:Number,
  enterprise:{},
  agency:{},
  invoiceAmount:{type:Number,default:0},
  totalAmount:{type:Number,default:0},
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
  paymentReceivedDate:Date,
  paymentMade:{type:Boolean,default:false},
  paymentMadeDate:Date,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

EnterpriseValuationInvoiceSchema.pre('save',function(next){
  var self = this;
  var prefix = 'EVRINV';
  var prefixRef = "QVA-";
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.invoiceNo = prefix+seqnum;
    self.referenceNo = prefixRef + seqnum;
    return next();
  },'EnterpriseValuationInvoice',100002);

})

module.exports = mongoose.model('EnterpriseValuationInvoice', EnterpriseValuationInvoiceSchema);

