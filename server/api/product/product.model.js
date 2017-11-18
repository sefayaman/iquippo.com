'use strict';

//var uniqueId = require('./uid.model');
var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProductSchema = new Schema({
  productId: String,
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
  productCondition:{type:String,default:'used'},
  images:[{}],
  videos:[{}],
  primaryImg: String,
  technicalInfo:{},
  serviceInfo:[{}],
  videoLinks:[{}],
  techSpec:[{}],
  isEngineRepaired:String,
  dispSellerInfo:String,
  dispSellerContact:String,
  dispSellerAlternateContact:String,
  alternateMobile:String,
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
  parkingPaymentTo:{type:String,default:'Seller'},
  certificationName:String,
  certificationLogo:String,
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
  //relisting:[{}],
  relistingDate: {type:Date,default:Date.now},
  assetDir:String,
  assetId:String,
  tradeType:{type: String,default: "SELL"},
  rateMyEquipment:String,
  tcDocumentName:String,
  specialOffers:String,
  rent:{},
  auctionListing:{type:Boolean,default:false},
  auction:{},
  valuationStamp:String,
  inquiryCounter : {type:Number,default:0},
  /*Field related to asset sale*/
  bidReceived:Boolean,
  bidCount:{type:Number,default:0},
  highestBid:{type:Number,default:0},
  buyerInfo:{},
  bidRequestApproved:{type:Boolean,default:false},
  cooling:{type:Boolean,default:false},
  coolingStartDate:Date,
  coolingEndDate : Date,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

ProductSchema.pre('save', function(next){
  var self = this;
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.productId = seqnum + 1;
    if(!self.assetId)
      self.assetId = self.productId;
    self.constructor.findOne({assetId:self.assetId,deleted:false},function(err,product){
      if(err)
        return next(err);
      if(product)
        return next(new Error("Asset id already exist"));
      return next();
      
    });
  },'productseq',new Date().getTime());
});

var Product = module.exports = mongoose.model('Product', ProductSchema);