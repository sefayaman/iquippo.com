var Modals = {
  login:{
    tplUrl:"app/account/login/login.html",
    Ctrl:'LoginCtrl as loginVm'
  },
   signup:{
    tplUrl:"app/account/signup/signup.html",
    Ctrl:'SignupCtrl as signupVm'
  },
  settings:{
    tplUrl:"app/account/settings/settings.html",
    Ctrl:'SettingsCtrl as settingsVm'
  },
  callback:{
    tplUrl:"app/callback/callback.html",
    Ctrl:'CallbackCtrl as callbackVm'
  },
  quote:{
    tplUrl:"app/quote/quote.html",
    Ctrl:'QuoteRequestCtrl'
  },
  getquote:{
    tplUrl:"app/product/getquote.html",
    Ctrl:'ProductQuoteCtrl'
  },
  forgotpassword:{
    tplUrl:"app/account/forgotpassword/forgotpassword.html",
    Ctrl:'ForgotPasswordCtrl as forgetPassVm'
  },
  classifiedad:{
     tplUrl:"app/classifiedaddes/classifiedadd.html",
    Ctrl:'ClassifiedAdCtrl as classifiedadVm'
  },
  adduser:{
    tplUrl:"app/admin/usermanagement/adduser.html",
    Ctrl:'AddUserCtrl'
  }
};

var priceRange = [
{
  min:0,
  max:2500000
},
{
  min:2500000,
  max:5000000
},
{
  min:5000000,
  max:"plus"
}
];

var importDir = "import";
var categoryDir = "category";
var avatarDir = "avatar";
var classifiedAdDir = "classifiedad";
var templateDir = "templates";
var UPLOAD_TEMPLATE_KEY = "BULK_PRODUCT_UPLOAD_TEMPLATE";

var assetStatuses = [
{
  name:"Listed",
  code:"listed"
},
{
  name:"Rented",
  code:"rented"
},
{
  name:"Sold",
  code:"sold"
}
]
var tradeType = [
{
  "name" : "Rent",
  "code" : "RENT"
},
{
  "name" : "Sell",
  "code" : "SELL"
},
{
  "name" : "Both",
  "code" : "BOTH"
}
];

var rateMyEquipmentOpt = [
{
  "name" : "Average"
},
{
  "name" : "Good"
},
{
  "name" : "Excellent"
}
];

var valuationList = [
{
  "name" : "Compliance",
  "code" : "Compliance"
},
{
  "name" : "Maintenence Estimation & Costing",
  "code" : "Maintenence_Estimation_And_Costing"
},
{
  "name" : "Buying or Selling of Asset",
  "code" : "Buying_Or_Selling_Of_Asset"
},
{
  "name" : "Acquisition or Repossesion",
  "code" : "Acquisition_Or_Repossesion"
},
{
  "name" : "Security of Loans or Mortgages",
  "code" : "Security_Of_Loans_Or_Mortgages"
},
{
  "name" : "Rent Function",
  "code" : "Rent_Function"
},
{
  "name" : "Taxation",
  "code" : "Taxation"
},
{
  "name" : "Other",
  "code" : "other"
}
]
var allCountries = [
{
    "name" : "India",
    "code" : "IN"
}
];

var HOME_BANNER =  [{
      image: 'Banner.jpg'
    }, {
      image: 'Banner1.jpg'
    }, {
      image: 'Banner2.jpg'
    }, {
      image: 'Banner3.jpg'
    }, {
      image: 'Banner4.jpg'
    }];

var serverPath = location.protocol +"//" + location.host;
//var serverPath = "http://14.141.64.180:8100";
var supportMail = "info@iquippo.com";
var supportContact = "011 66025672";
//var supportMail = "bharat.hinduja@bharatconnect.com";
var informationMessage = {};

informationMessage['unknownError'] = "There is some issue.Please contact our support team.";

/*callback message*/
informationMessage['callbackSuccess'] = "Your request has been successfully received. We will contact you soon. Thank you.";

/*quote request message*/
informationMessage['quoteSuccess'] = "Your quote request successfully submitted.";

/*cart messages*/

informationMessage['cartAddedSuccess'] = "Product added successfully!";
informationMessage['cartAddedError'] = "Error in adding product to the cart!";
informationMessage['cartLoginError'] = "Please login to add product in the Cart!";
informationMessage['productAlreadyInCart']  = "This product is already added in your cart!";
informationMessage['deleteCartProductConfirm'] = "Do you want to delete this product from your cart?";
informationMessage['clearCartConfirm'] = "Do you want to clear your cart?";
informationMessage['deleteCartProductSuccess'] = "Product removed from cart successfully!";
informationMessage['clearCartSuccess'] = "Cart cleared successfully!";

/*partner messsage */
informationMessage['deletePartnerConfirm'] = "Do you want to delete this partner?";

/*contact us messsage */
informationMessage['contactUsSuccess'] = "Your request has been successfully received. We will contact you soon!";

/*messages on product details*/
informationMessage['productQuoteSuccess'] = "Your request for quote submitted successfully!";
informationMessage['buyRequestSuccess'] = "Your request to buy has been submitted successfully!";
informationMessage['productUpdateMessage'] = "This operation will make product inactive and needs administrator approval for activation. Do you want to continue?";

/*vendor registration messages */
informationMessage['vendorSuccess'] = "Your have been successfully register!";

/*classifiedadd messages*/
informationMessage['classifiedSuccess'] = "Your request for Classified Ad has been successfully received.";

/*channel partner messsage */
informationMessage['deleteChannelPartnerConfirm'] = "Do you want to delete this channel partner?";

/*
Date: 06/06/2016
DevloperName : Nishnat
Purpose: declare Constant for Google Tag Manager
*/
var gaMasterObject = {
quickQueryClose:{
  event: 'Click',
  eventCategory: 'quickQuery',
  eventAction: 'close',
  eventLabel: 'Product Query Close'
},
quickQueryOpen:{
  event: 'Click',
  eventCategory: 'quickQuery',
  eventAction: 'open',
  eventLabel: 'Product Query Open'
},
quickQuerySubmit:{
  event: 'Click',
  eventCategory: 'quickQuery',
  eventAction: 'submit',
  eventLabel: 'Product Query Submit'
},
callbackClose:{
  event: 'Click',
  eventCategory: 'callback',
  eventAction: 'close',
  eventLabel: 'callback Close'
},
callBackOpen:{
  event: 'Click',
  eventCategory: 'callback',
  eventAction: 'open',
  eventLabel: 'callBack Open'
},
callBackSubmit:{
  event: 'Click',
  eventCategory: 'callback',
  eventAction: 'submit',
  eventLabel: 'callBack Submit'
},
aboutusPage:{
  event: 'pageview',
  page: '/aboutus'
},
contactUsPage:{
  event: 'pageview',
  page: '/contactus'
},
contactUsSend:{
  event: 'Click',
  eventCategory: 'contactUs',
  eventAction: 'click',
  eventLabel: 'Contact Send'
},
shippingPage:{
  event: 'pageview',
  page: '/shipping'
},
valuationPage:{
  event: 'pageview',
  page: '/valuation'
},
certifiedbyiquippoPage:{
  event: 'pageview',
  page: '/certifiedbyiquippo'
},
manpowerPage:{
  event: 'pageview',
  page: '/manpower'
},
shippingSubmit:{
  event: 'Click',
  eventCategory: 'shipping',
  eventAction: 'submit',
  eventLabel: 'Shipping Submit'
},
shippingReset:{
  event: 'Click',
  eventCategory: 'shipping',
  eventAction: 'reset',
  eventLabel: 'Shipping Reset'
},
valuationSubmit:{
  event: 'Click',
  eventCategory: 'valuation',
  eventAction: 'submit',
  eventLabel: 'Valuation Submit'
},
valuationReset:{
  event: 'Click',
  eventCategory: 'valuation',
  eventAction: 'reset',
  eventLabel: 'Valuation Reset'
},
certifiedbyiquippoSubmit:{
  event: 'Click',
  eventCategory: 'certifiedbyiquippo',
  eventAction: 'submit',
  eventLabel: 'Certified By Iquippo Submit'
},
certifiedbyiquippoReset:{
  event: 'Click',
  eventCategory: 'certifiedbyiquippo',
  eventAction: 'reset',
  eventLabel: 'Certified By Iquippo Reset'
},
manpowerSubmit:{
  event: 'Click',
  eventCategory: 'manpower',
  eventAction: 'submit',
  eventLabel: 'Manpower Submit'
},
manpowerReset:{
  event: 'Click',
  eventCategory: 'manpower',
  eventAction: 'reset',
  eventLabel: 'Manpower Reset'
},
classifiedAdClick:{
  event: 'Click',
  eventCategory: 'classifiedAd',
  eventAction: 'open',
  eventLabel: 'Place a Classified Ad'
},
classifiedAdReset:{
  event: 'Click',
  eventCategory: 'classifiedAd',
  eventAction: 'reset',
  eventLabel: 'classifiedAd Reset'
},
classifiedAdClose:{
  event: 'Click',
  eventCategory: 'classifiedAd',
  eventAction: 'close',
  eventLabel: 'classifiedAd Close'
},
classifiedAdSubmit:{
  event: 'Click',
  eventCategory: 'classifiedAd',
  eventAction: 'submit',
  eventLabel: 'classifiedAd Submit'
},
uploadProductClick:{
  event: 'Click',
  eventCategory: 'uploadProduct',
  eventAction: 'open',
  eventLabel: 'uploadProduct Click'
},
uploadProductSubmit:{
  event: 'Click',
  eventCategory: 'uploadProduct',
  eventAction: 'submit',
  eventLabel: 'uploadProduct Submit'
},
uploadProductReset:{
  event: 'Click',
  eventCategory: 'uploadProduct',
  eventAction: 'reset',
  eventLabel: 'uploadProduct Reset'
},
uploadProductPreview:{
  event: 'Click',
  eventCategory: 'uploadProduct',
  eventAction: 'preview',
  eventLabel: 'uploadProduct Preview'
},
addToCartSendMessage:{
  event: 'Click',
  eventCategory: 'Send Message',
  eventAction: 'click',
  eventLabel: 'Send Message'
},
addToCartCompare:{
  event: 'Click',
  eventCategory: 'Compare',
  eventAction: 'click',
  eventLabel: 'Compare'
},
viewCategory: {
  'name': '',       // name
  'id': '', //ProductID
  'price': '',//grossPrice
  'brand': '',      //brand.name
  'category': '',//category.name
  'list': '',
  'position': '',
  'dimension3':'',
  'dimension4':''
},
EquipmentSearch:{
  event: 'Click',
  eventCategory: 'EquipmentSearch',
  eventAction: 'click',
  eventLabel: ''
},
productDetails: {
  'name': '',                      // Name or ID is required.
  'id':'',
  'price':'',
  'brand': '',
  'category': '',
  'position': '',
  'dimension3':'',
  'dimension4':''
},
addToCart:{
  'name': '',
  'id': '',
  'price': '',
  'brand': '',
  'category': ''
},
removeToCart:{
  'name': '',
  'id': '',
  'price': '',
  'brand': '',
  'category': ''
},
toBuyContact:{
  event: 'Click',
  eventCategory: 'toBuyContact',
  eventAction: 'click',
  eventLabel: 'Send Message'
},
calculateNow:{
  event: 'Click',
  eventCategory: 'calculateNow',
  eventAction: 'click',
  eventLabel: 'Calculate Now'
},
getaQuoteforAdditionalServices:{
  event: 'Click',
  eventCategory: 'getaQuoteforAdditionalServices',
  eventAction: 'Open',
  eventLabel: 'getaQuoteforAdditionalServicesOpen'
},
getaQuoteforAdditionalServicesReset:{
  event: 'Click',
  eventCategory: 'getaQuoteforAdditionalServices',
  eventAction: 'Reset',
  eventLabel: 'getaQuoteforAdditionalServicesReset'
},
getaQuoteforAdditionalServicesSubmit:{
  event: 'Click',
  eventCategory: 'getaQuoteforAdditionalServices',
  eventAction: 'Submit',
  eventLabel: 'getaQuoteforAdditionalServicesSubmit'
},
getaQuoteforAdditionalServicesClose:{
  event: 'Click',
  eventCategory: 'getaQuoteforAdditionalServices',
  eventAction: 'Close',
  eventLabel: 'getaQuoteforAdditionalServicesClose'
},
sendMessage:{
  'name': '',
  'dimension2': '1',
  'id': '',
  'price': '',
  'brand': '',
  'category': ''
}
};
