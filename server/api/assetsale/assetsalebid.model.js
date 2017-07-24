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
            reservePrise:Number
          },
  offerType:String,
  ageingOfAsset:Number,
  parkingCharge:Number,
  bidAmount:Number,
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
    emdAmount:Number,
    remaingPayment:Number,
    paymentsDetail:[{}]
  },
  fullPayment:{
    paymentMode:String,
    fullPaymentAmount:Number,
    remaingPayment:Number,
    paymentsDetail:[{}]
  },
  invoiceDetail:{},
  proxyBid:{type:Boolean,default:false},
  status:{type:Boolean,default:true},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

AssetSaleBidSchema.pre('save',function(next){
  var self = this;
  var prefix = 'TAS';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.ticketId = prefix+seqnum;
    return next();
  },'assetsale',100002);

})

module.exports = mongoose.model('AssetSaleBid', AssetSaleBidSchema);
