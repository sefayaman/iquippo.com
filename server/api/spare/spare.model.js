'use strict';

//var uniqueId = require('./uid.model');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SpareSchema = new Schema({
  partId: Number,
  partNo:String,
  serialNo:String,
  name:String,
  description:String,
  manufacturers:{},
  currencyType: {
    type: String,
    default: "INR"
  },
  grossPrice:Number,
  priceOnRequest:{type:Boolean,default:false},
  paymentOption:[String],
  commission:Number,
  country:String,
  locations : [{}],
  madeIn : String,
  productCondition:String,
  images:[{}],
  primaryImg: String,
  miscDocuments:[{}],
  status:{type:String,default:'inactive'},
  spareStatuses:[{}],
  spareDetails:[{}],
  deleted: {
    type: Boolean,
    default: false
  },
  user: {},
  seller:{},
  isSold:{type:Boolean,default:false},
  assetDir:String,
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

SpareSchema.pre('save', function(next){
  var doc = this;
  var uIdNum;
  var uid = Math.round(Math.random() * 1000000) + "";
  // get the Unique Id
  uIdNum = parseInt(uid);
  generateUniqueId(next, doc, uIdNum);
});

var generateUniqueId = function (next, doc, uIdNum){
  var digitArr = [0,1,2,3,4,5,6,7,8,9];
  var filter = {};
  if(uIdNum <= 99999) {
    var uIdStr = uIdNum + "";
    uIdStr += digitArr[Math.floor(Math.random() * digitArr.length -1)];
    if(uIdStr.length < 6) {
      //console.log("countlength", uIdStr + "__" + uIdStr.length);
      generateUniqueId(next, doc, parseInt(uIdStr));
      return;
    }
  }
  if(uIdStr) 
    uIdNum = parseInt(uIdStr);
  if(uIdNum)
    filter['partId'] = uIdNum;
  Spare.find(filter,function(error,uIdNo){
    if(!error){
      if(uIdNo.length == 0) {
          console.log("Not exist", uIdNum);
          /*uniqueId.create({'uidNumber': uIdNum}, function(err, uIdNo) {
            if(err) { console.log("Error", err); }
          });*/
          doc.partId = uIdNum;
          next();
        } else {
          console.log("already exist", uIdNum);
          var uid = Math.round(Math.random() * 1000000) + "";
          generateUniqueId(next, doc, uid);
          return;
        }
      } else {
        console.log("Error", error);
      }
    });
}

var Spare = module.exports = mongoose.model('Spare', SpareSchema);