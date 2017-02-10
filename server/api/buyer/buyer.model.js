'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BuyerSchema = new Schema({
  seller: {},
  product: [],
  spares: [],
  fname: String,
  mname: String,
  lname: String,
  country: String,
  phone: String,
  mobile: String,
  email: { type: String, lowercase: true },
  requestType:{type:String,default:'contactInfo'},
  transactionId:String,
  contact: {
    type: String,
    default: 'email'
  },
  interestedIn: String,
  financeInfo: {},
  message: String,
  ticketId : String,
  createdAt: Date,
  updatedAt: Date
});

BuyerSchema.pre('save',function(next){
  var self = this;
  var prefix = 'SM-FB_' + self.mobile;
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.ticketId = prefix+'_'+seqnum;
    return next();
  },'buyers',100002);
})




module.exports = mongoose.model('Buyer', BuyerSchema);
