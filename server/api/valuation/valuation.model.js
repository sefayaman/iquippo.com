// 'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var sequence = require('./../../components/seqgenerator').sequence();
var ValuationRequestSchema = new Schema({
  //uniqueControlNo:String,
  requestType:String,
  jobId:String,
  user: {},
  seller:{},
  initiatedBy:String,
  requestId:String,
  valuationAgency:{},
  enterprise:{type:String, default:'retail'},
  product: {},
  assetCategory:String,
  valuerGroupId:String,
  transactionId:String,
  transactionIdRef:{type:Schema.Types.ObjectId,ref:'PaymentTransaction'},
  status:{type:String},
  statuses:[{}],
  comment:String,
  report:String,
  invoiceLink:String,
  purpose:String,
  contactPerson:String,
  contactNumber:String,
  schedule:String,
  scheduleDate:Date,
  scheduledTime:String,
  payOption:String,
  /*Admin update field*/
  onHold:{type:Boolean,default:false},
  onHoldDate:Date,
  onHoldMsg:String,
  resumeDate:Date,
  resumedBy:{},
  userComment:String,
  cancelled:{type:Boolean,default:false},
  //cancellationFee:Number,
  cancelledBy:{},

  invoiceNo:String,
  reportDate:Date,

  reportNo:String,
  assetNo:String,
  agencyYearOfManufacturing:String,
  agencyEngineNo:String,
  agencyChassisNo:String,
  agencyRegistrationNo:String,
  agencySerialNo:String,
  valuationReport:{},
  hmr_kmr:String,
  assessedValue:Number,
  inspectionBy:String,
  physicalCondition:String,
  gpsInstalled:{type:Boolean},
  gpsDeviceNo:String,
  gpsIMEINo:String,
  overallGeneralCondition:String,
  generalImage:{},
  engineImage:{},
  hydraulicImage:{},
  cabinImage:{},
  underCarriageImage:{},
  otherImage:{},
  
  invoiceData:{},
  resubmit:{type:Boolean,default:false},
  remarks:String,
  submittedToAgencyDate:Date,
  isAuction:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

ValuationRequestSchema.pre('save', function(next){
  var doc = this;
  var cprefix = 'IV';
  var invfix = 'IN';
  if(doc.requestId)
    return next();
  // get the next sequence
  sequence.next(function(nextSeq){
    if(doc.requestId)
      return next();  
    var date = new Date();
    var dateStr = date.getDate()+ "" + (date.getMonth() + 1)+ "" + date.getFullYear();
    doc.requestId = cprefix + dateStr + nextSeq;
    doc.invoiceNo = invfix + nextSeq;
    return next();
  },"valuation");
});

module.exports = mongoose.model('ValuationRequest', ValuationRequestSchema);
