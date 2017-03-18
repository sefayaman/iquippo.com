// 'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseValuationSchema = new Schema({
  uniqueControlNo:String,
  requestType:String,
  purpose:String,
  agency:{},
  enterprise:{},
  customerTransactionId:String,
  customerValuationNo:String,
  customerPartyNo:String,
  customerPartyName:String,
  userName: String,
  requestDate: {type:Date,default:Date.now},
  assetId:String,
  repoDate: {type:Date,default:Date.now},
  category:String,
  brand:String,
  model:String,
  assetDescription:String,
  engineNo:String,
  chassisNo:String,
  registrationNo:String,
  invoiceDate:{type:Date},
  yardParked:String,
  country:String,
  state:String,
  city:String,
  contactPerson:String,
  contactPersonTelNo:String,
  disFromCustomerOffice:String,
  deleted:{type:Boolean,default:false},
  status:{type:String,default:"Request Initiated"},
  statuses:[],
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

EnterpriseValuationSchema.pre('save',function(next){
  var self = this;
  var prefix = 'EVR';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.uniqueControlNo = prefix+seqnum;
    return next();
  },'EnterpriseValuation',10000002);

})

module.exports = mongoose.model('EnterpriseValuation', EnterpriseValuationSchema);

