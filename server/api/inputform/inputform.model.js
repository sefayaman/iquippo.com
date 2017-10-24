// 'use strict';
var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InputFormRequestSchema = new Schema({
  referenceNo:String,
  user:{
    userData : {type:Schema.Types.ObjectId,ref:'User'},
    fname:String,
    lname:String,
    mobile:String,
    email:String,
    country:String
    },
  category:String,
  brand:String,
  model:String,
  state:String,
  quantity:Number,
  tenure:Number,
  installmentPerUnit:Number,
  marginPerUnit:Number,
  processingFee:Number,
  totalInstallment:Number,
  totalMargin:Number,
  totalProcessingFee:Number,
  remark:String,
  bannerInfo:{
    bannerData : {type:Schema.Types.ObjectId,ref:'Banner'},
    name:String,
    code:String,
  },
  paymentInfo:{},
  deleted: {
    type: Boolean,
    default: false
  },
  status:{type:String,default:"Pending"},
  statuses:[{}],
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

InputFormRequestSchema.pre('save',function(next){
  var self = this;
  var prefix = 'IF';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.referenceNo = prefix + seqnum;
    return next();
  },'inputform',100002);

});

module.exports = mongoose.model('InputFormRequest', InputFormRequestSchema);
