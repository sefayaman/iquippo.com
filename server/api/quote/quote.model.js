'use strict';

var seqGenerator = require('../../components/seqgenerator');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var QuoteSchema = new Schema({
  fname: String,
  mname: String,
  lname: String,
  phone: String,
  mobile: String,
  email: { type: String, lowercase: true },
  group: String,
  category: String,
  subcategory:String,
  brand: String,
  model: String,
  expPrice:String,
  city:String,
  notifyCounter: {
    type: Number,
    default: 0
  },
  agree:Boolean,
  comment: String,
  ticketId : String,
  createdAt: Date
});

QuoteSchema.pre('save',function(next){
  var self = this;
  var prefix = 'GQ';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.ticketId = prefix+seqnum;
    return next();
  },'quotes',100002);

})

module.exports = mongoose.model('Quote', QuoteSchema);