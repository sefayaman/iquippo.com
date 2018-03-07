'use strict';

var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BannerLeadSchema = new Schema({
  ticketId:String,
  fname: String,
  lname:String,
  email:String,
  mobile:String,
  comment:String,
  state:String,
  country:String,
  product:String,
  user:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

BannerLeadSchema.pre('save',function(next){
  var self = this;
  var prefix = 'BL';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.ticketId = prefix + seqnum;
    return next();
  },'BannerLead',"100002");

});

module.exports = mongoose.model('BannerLead', BannerLeadSchema);