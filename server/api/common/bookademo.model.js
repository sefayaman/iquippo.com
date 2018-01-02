'use strict';
var seqGenerator = require('../../components/seqgenerator');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var BookADemoSchema = new Schema({
  ticketId:String,
  fname: String,
  lname: String,
  phone:String,
  mobile:String,
  email:String,
  country:String,
  countryCode:String,
  state: String,
  city: String,
  product:{type:Schema.Types.ObjectId,ref:'Product'},
  category:String,
  brand:String,
  model:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
  
});

BookADemoSchema.pre('save',function(next){
  var self = this;
  var prefix = 'DR';
  var sequence = seqGenerator.sequence();
  sequence.next(function(seqnum){
    self.ticketId = prefix + seqnum;
    return next();
  },'BookADemo',"100002");

});

module.exports = mongoose.model('BookADemo', BookADemoSchema);