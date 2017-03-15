// 'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseValuationSchema = new Schema({
  uniqueControlNo:String,
  requestType:String,
  purpose:String,
  agencyName:String,
  enterpriseName:String,
  customerTransactionId:String,
  customerValuationNo:String,
  customerPartyNo:String,
  customerPartyName:String,
  user: {},
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
  invoiceDate:{type:Date,default:Date.now},
  yardParked:String,
  country:String,
  state:String,
  city:String,
  contactPerson:String,
  contactPersonTelNo:String,
  disFromCustomerOffice:String,
  deleted:{type:Boolean,default:false},
  status:{type:String,default:"Request Initiated"},
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

