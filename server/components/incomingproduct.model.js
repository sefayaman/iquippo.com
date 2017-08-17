'use strict';

//var uniqueId = require('./uid.model');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var IncomingProductSchema = new Schema({
  name:String,
  variant:String,
  model:{},
  brand:{},
  group: {},
  category: {},
  subcategory:{},
  mfgYear:String,
  operatingHour:String,
  mileage:String,
  serialNo:String,
  currencyType: {
    type: String,
    default: "INR"
  },
  grossPrice:Number,
  priceOnRequest:{type:Boolean,default:false},
  country:String,
  state:String,
  city:String,
  productCondition:String,
  images:[{}],
  primaryImg: String,
  technicalInfo:{},
  serviceInfo:[{}],
  videoLinks:[{}],
  isEngineRepaired:String,
  comment:String,
  videoName:String,
  documentName:String,
  miscDocuments:[{}],
  assetStatus:{type:String,default:'listed'},
  assetStatuses:[{}],
  featured: {type:Boolean,default:false},
  repoDate:Date,
  valuationAmount:Number,
  parkingChargePerDay:Number,
  addressOfAsset:String,
  reservePrice:Number,
  taxRate:Number,
  deleted: {
    type: Boolean,
    default: false
  },
  expired: {
    type: Boolean,
    default: false
  },
  expiryAlert: {
    type: Boolean,
    default: false
  },
  status: {
    type: Boolean,
    default: false
  },
  user: {},
  seller:{},
  isSold:{type:Boolean,default:false},
  sellInfo:{},
  relisting:[{}],
  relistingDate: {type:Date,default:Date.now},
  assetDir:String,
  assetId:String,
  tradeType:String,
  rateMyEquipment:String,
  tcDocumentName:String,
  rent:{},
  inquiryCounter : {type:Number,default:0},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now},
  lock:{type:Boolean,default:false},
  specialOffers : String,
  dispSellerInfo:String,
  dispSellerContact:String,
  dispSellerAlternateContact:String,
  alternateMobile  : String,
  
});

module.exports = mongoose.model('IncomingProduct', IncomingProductSchema);