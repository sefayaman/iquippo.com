'use strict';
var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AssetSaleBidSchema = new Schema({
  ticketId:String,
  user:{type:Schema.Types.ObjectId,ref:'User'},
  product:{
            proData : {type:Schema.Types.ObjectId,ref:'Product'},
            assetId:String,
            assetDir:String,
            name:String,
            category:String,
            brand:String,
            model:String,
            mfgYear:String,  
            country:String,
            state:String,
            stateId:String,
            city:String,
            comment:String,
            seller:{},
            repoDate:Date,
            reservePrise:Number,
            prevTradeType:String,
            primaryImg:String
          },
  offerType:{type:String,default:'Bid'},
  ageingOfAsset:Number,
  parkingCharge:Number,
  parkingPaymentTo:String,
  gst:Number,
  tcs:Number,
  actualBidAmount:Number,
  bidAmount:Number,
  emdAmount:Number,
  fullPaymentAmount:Number,
  offerStatus:String,
  bidStatus:String,
  dealStatus:String,
  assetStatus:String,
  tradeType:String,
  offerStatuses:[{}],
  dealStatuses:[{}],
  bidStatuses:[{}],
  assetStatuses:[{}],
  tradeTypeStatuses:[{}],
  kyc:[{}],
  emdPayment:{
    paymentMode:String,
    remainingPayment:{type:Number,default:0},
    paymentsDetail:[{
      createdAt: {type:Date,default:Date.now},
      paymentDate : Date,
      amount : {type:Number,default:0},
      instrumentNo : String,
      bankName : String,
      paymentMode : String
    }]
  },
  fullPayment:{
    paymentMode:String,
    remainingPayment:{type:Number,default:0},
    paymentsDetail:[{
      createdAt: {type:Date,default:Date.now},
      paymentDate : Date,
      amount : {type:Number,default:0},
      instrumentNo : String,
      bankName : String,
      paymentMode : String
    }]
  },
  invoiceDetail:{},
  emdStartDate:Date,
  emdEndDate:Date,
  fullPaymentStartDate:Date,
  fullPaymentEndDate:Date,
  deliveryOrder:String,
  dateOfDelivery:Date,
  rating:Number,
  comment:String,
  proxyBid:{type:Boolean,default:false},
  lastAccepted:{type:Boolean,default:false},
  status:{type:Boolean,default:true},
  bidChanged:{type:Boolean,default:false},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

AssetSaleBidSchema.pre('save',function(next){
  var self = this;
  var offerType = self.offerType;
  var prefix = '';

  switch(offerType){
    case 'Bid' :
      prefix = 'SB'
      break;
    case 'Buynow' : 
      prefix = 'BN'
      break;
  }
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.ticketId = prefix+seqnum;
    return next();
  },'assetsale',100002);

})

module.exports = mongoose.model('AssetSaleBid', AssetSaleBidSchema);
