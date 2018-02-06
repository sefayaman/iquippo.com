// 'use strict';

var seqGenerator = require('../../components/seqgenerator');
var async = require('async');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EnterpriseValuationInvoiceSchema = new Schema({
  requestType:String,
  invoiceNo:String,
  referenceNo:String,
  uniqueControlNos:[],
  assetCategory:String,
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
  iqInvoiceNo:String,
  invoiceDate:{type:Date,default:Date.now},
  invoiceInFavour:String,
  userPanNumber:String,
  userAadhaarNumber:String,
  userAddress:String,
  userCountry:String,
  userState:String,
  userCity:String,
  userGstin:String,
  iquippoGstState:String,
  iquippoGstin:String,
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
  var sequence = seqGenerator.sequence();
  var prefix = 'IQS';
  var prefixRef = "QVA-";
  sequence.next(function(seqnum){
      var invcDate = new Date(self.invoiceDate || new Date());
      self.invoiceNo = prefix+ "-"+ getFiscalYearByDate(invcDate) + "-" + seqnum;
      self.referenceNo = prefixRef + seqnum;
      return next();
    },'EnterpriseValuationInvoice_2018',100002);
});

function getFiscalYearByDate(date) {
    var curMonth = date.getMonth();
    var currentYear = date.getFullYear().toString();
    currYrPart = currentYear.charAt(2) + currentYear.charAt(3);
    var fiscalYr = "";
    if (curMonth > 2) {
        var nextYr1 = (date.getFullYear() + 1).toString();
        fiscalYr = currYrPart + "" + nextYr1.charAt(2) + nextYr1.charAt(3);
    } else {
        var prevYear = (date.getFullYear() - 1).toString();
        fiscalYr =  prevYear.charAt(2) + prevYear.charAt(3) + "" +currYrPart;
    }
    return fiscalYr;
 }

module.exports = mongoose.model('EnterpriseValuationInvoice', EnterpriseValuationInvoiceSchema);

