'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GenerateCouponSchema = new Schema({
  user:{},
  refBy:{},
  code:String,
  sDate:{type:Date,default:Date.now},
  eDate:{type:Date,default:Date.now},
  refAmount:{
    type: Number,
    default: 0
  },
  joinAmount:{
    type: Number,
    default: 0
  },
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

GenerateCouponSchema.pre('save', function(next){
  var doc = this;
  var uIdNum;
  var uid = Math.round(Math.random() * 10000) + "";
  // get the Unique Id
  uIdNum = parseInt(uid);
  generateUniqueCode(next, doc, uIdNum);
});

var generateUniqueCode = function (next, doc, uIdNum){
  var digitArr = [0,1,2,3,4,5,6,7,8,9];
  var filter = {};
  if(uIdNum <= 999) {
    var uIdStr = uIdNum + "";
    uIdStr += digitArr[Math.floor(Math.random() * digitArr.length -1)];
    if(uIdStr.length < 4) {
      generateUniqueCode(next, doc, parseInt(uIdStr));
      return;
    }
  }
  if(uIdStr) 
    uIdNum = parseInt(uIdStr);
  if(uIdNum) {
    var fname = doc.user.fname.toUpperCase();
    var lname = doc.user.lname.toUpperCase();
    var code = fname.substr(0,4) + lname.substr(0,3) + uIdNum;
    filter['code'] = code;
  }
  GenerateCoupon.find(filter,function(error,uIdNo){
    if(!error){
      if(uIdNo.length == 0) {
          //console.log("Not exist", uIdNum);
          doc.code = code;
          next();
        } else {
          //console.log("already exist", uIdNum);
          var uid = Math.round(Math.random() * 10000) + "";
          generateUniqueCode(next, doc, uid);
          return;
        }
      } else {
        console.log("Error", error);
      }
    });
}
var GenerateCoupon = module.exports = mongoose.model('GenerateCoupon', GenerateCouponSchema);