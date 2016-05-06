'use strict';

//var uniqueId = require('./uid.model');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProductSchema = new Schema({
  productId: Number,
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
  productCondition:String,
  images:[{}],
  primaryImg: String,
  technicalInfo:{},
  serviceInfo:[{}],
  videoLinks:[{}],
  isEngineRepaired:String,
  comment:String,
  videoName:String,
  documentName:String,
  miscDocuments:[{}],
  assetStatus:{type:String,default:'listed'},
  assetStatuses:[{}],
  featured: {type:Boolean,default:false},
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
  tradeType:String,
  rateMyEquipment:String,
  tcDocumentName:String,
  rent:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

ProductSchema.pre('save', function(next){
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
    filter['productId'] = uIdNum;
  Product.find(filter,function(error,uIdNo){
    if(!error){
      if(uIdNo.length == 0) {
          console.log("Not exist", uIdNum);
          /*uniqueId.create({'uidNumber': uIdNum}, function(err, uIdNo) {
            if(err) { console.log("Error", err); }
          });*/
          doc.productId = uIdNum;
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

var Product = module.exports = mongoose.model('Product', ProductSchema);