// 'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseValuationSchema = new Schema({
  /* Enterprise fields*/
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
  requestDate:Date,
  assetId:String,
  repoDate:Date,
  brand:String,
  otherBrand:String,
  model:String,
  otherModel:String,
  assetCategory:String,
  valuerGroupId:String,
  valuerAssetId:String,
  assetDescription:String,
  engineNo:String,
  chassisNo:String,
  registrationNo:String,
  serialNo:String,
  yearOfManufacturing:String,
  invoiceDate:{type:Date},
  yardParked:String,
  country:String,
  state:String,
  city:String,
  contactPerson:String,
  contactPersonTelNo:String,
  disFromCustomerOffice:String,
  /* Valuation agency  field */
  jobId:String,
  reportDate:Date,
  reportNo:String,
  agencyYearOfManufacturing:String,
  agencyEngineNo:String,
  agencyChassisNo:String,
  agencyRegistrationNo:String,
  agencySerialNo:String,
  hmr_kmr:String,
  assessedValue:Number,
  inspectionBy:String,
  physicalCondition:String,
  gpsInstalled:{type:Boolean},
  gpsDeviceNo:String,
  gpsIMEINo:String,
  generalImage:{},
  engineImage:{},
  hydraulicImage:{},
  cabinImage:{},
  underCarriageImage:{},
  otherImage:{},
  valuationReport:{},
  /*Admin update field*/
  invoiceNo:String,
  invoiceDate:Date,
  paymentReceived:{type:Boolean,default:false},
  paymentMade:{type:Boolean,default:false},
  /*Common fields*/
  assetDir:String,
  remarks:String,
  deleted:{type:Boolean,default:false},
  status:{type:String,default:"Request Initiated"},
  statuses:[],
  createdBy:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

EnterpriseValuationSchema.pre('save',function(next){
  var self = this;
  var cprefix = 'EV';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    var date = new Date();
    var dateStr = date.getDate()+ "" + (date.getMonth() + 1)+ "" + date.getFullYear();
    self.uniqueControlNo = cprefix + dateStr + seqnum;
    return next();
  },'EnterpriseValuation',002);

})

module.exports = mongoose.model('EnterpriseValuation', EnterpriseValuationSchema);
