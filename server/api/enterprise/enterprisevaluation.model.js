'use strict';

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
  legalEntityName: String,
  requestDate:{type:Date,default:Date.now},
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
  yardParked:String,
  country:String,
  state:String,
  city:String,
  contactPerson:String,
  contactPersonTelNo:String,
  disFromCustomerOffice:String,
  customerInvoiceDate:Date,
  customerInvoiceValue:Number,
  invoiceDoc:{},
  rcDoc:{},
  originalOwner:String,
  /* Valuation agency  field */
  submittedToAgencyDate:Date,
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
  images:[],
  generalImage:{},
  engineImage:{},
  hydraulicImage:{},
  cabinImage:{},
  underCarriageImage:{},
  otherImage:{},
  valuationReport:{},
  overallGeneralCondition:String,
  /*Admin update field*/
  invoiceNo:String,
  invoiceDate:Date,
  paymentReceived:{type:Boolean,default:false},
  paymentMade:{type:Boolean,default:false},
  /*Common fields*/
  assetDir:String,
  remarks:String,
  auditLogs:[{}],
  deleted:{type:Boolean,default:false},
  cancelled:{type:Boolean,default:false},
  cancellationFee:Number,
  cancelledBy:{},
  onHold:{type:Boolean,default:false},
  onHoldDate:Date,
  onHoldMsg:String,
  resumeDate:Date,
  resumedBy:{},
  requestModified:{type:Boolean,default:false},
  requestModifiedDate:Date,
  requestModifiedMsg:String,
  fieldsModified:String,
  userComment:String,
  status:{type:String,default:"Request Initiated"},
  statuses:[],
  createdBy:{},
  nameOfCustomerSeeking : String,
  resubmit:{type:Boolean,default:false},
  reportSubmissionDate:Date,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

EnterpriseValuationSchema.pre('save',function(next){
  var self = this;
  var cprefix = 'EV';
  if(self.uniqueControlNo)
      return next();
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    if(self.uniqueControlNo)
      return next();  
    var date = new Date();
    var dateStr = date.getDate()+ "" + (date.getMonth() + 1)+ "" + date.getFullYear();
    self.uniqueControlNo = cprefix + dateStr + seqnum;
    return next();
  },'EnterpriseValuation',"002");

});

module.exports = mongoose.model('EnterpriseValuation', EnterpriseValuationSchema);

