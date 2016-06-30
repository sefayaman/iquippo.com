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
  eventCategory: 'Home_QuickQuery',
  eventAction: 'Home_QuickQuery_Close',
  eventLabel: 'Home Quick Query Close'
},
quickQueryOpen:{
  event: 'Click',
  eventCategory: 'Home_QuickQuery',
  eventAction: 'Home_QuickQuery_Open',
  eventLabel: 'Home Quick Query Open'
},
quickQuerySubmit:{
  event: 'Click',
  eventCategory: 'Home_QuickQuery',
  eventAction: 'Home_QuickQuery_Submit',
  eventLabel: 'Home Quick Query Submit'
},
callbackClose:{
  event: 'Click',
  eventCategory: 'Home_Callback',
  eventAction: 'Home_Callback_Close',
  eventLabel: 'Home Callback Close'
},
callBackOpen:{
  event: 'Click',
  eventCategory: 'Home_Callback',
  eventAction: 'Home_Callback_Open',
  eventLabel: 'Home Callback Open'
},
callBackSubmit:{
  event: 'Click',
  eventCategory: 'Home_Callback',
  eventAction: 'Home_Callback_Submit',
  eventLabel: 'Home Callback Submit'
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
  eventCategory: 'Contact_Us',
  eventAction: 'Contact_Us_Send',
  eventLabel: 'Contact_Us_Send'
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
  eventCategory: 'Services_Shipping',
  eventAction: 'Services_Shipping_Submit',
  eventLabel: 'Services_Shipping_Submit'
},
shippingReset:{
  event: 'Click',
  eventCategory: 'Services_Shipping',
  eventAction: 'Services_Shipping_Reset',
  eventLabel: 'Services_Shipping_Reset'
},
valuationSubmit:{
  event: 'Click',
  eventCategory: 'Services_Valuation',
  eventAction: 'Services_Valuation_Submit',
  eventLabel: 'Services_Valuation_Submit'
},
valuationReset:{
  event: 'Click',
  eventCategory: 'Services_Valuation',
  eventAction: 'Services_Valuation_Reset',
  eventLabel: 'Services_Valuation_Reset'
},
certifiedbyiquippoSubmit:{
  event: 'Click',
  eventCategory: 'Services_CertifiedByiQuippo',
  eventAction: 'Services_CertifiedByiQuippo_Submit',
  eventLabel: 'Services_CertifiedByiQuippo_Submit'
},
certifiedbyiquippoReset:{
  event: 'Click',
  eventCategory: 'Services_CertifiedByiQuippo',
  eventAction: 'Services_CertifiedByiQuippo_Reset',
  eventLabel: 'Services_CertifiedByiQuippo_Reset'
},
manpowerSubmit:{
  event: 'Click',
  eventCategory: 'Services_Manpower',
  eventAction: 'Services_Manpower_Submit',
  eventLabel: 'Services_Manpower_Submit'
},
manpowerReset:{
  event: 'Click',
  eventCategory: 'Services_Manpower',
  eventAction: 'Services_Manpower_Reset',
  eventLabel: 'Services_Manpower_Reset'
},
classifiedAdClick:{
  event: 'Click',
  eventCategory: 'Home_Classified_Ad',
  eventAction: 'Home_Classified_Ad_Click',
  eventLabel: 'Home_Classified_Ad_Click'
},
classifiedAdReset:{
  event: 'Click',
  eventCategory: 'Home_Classified_Ad',
  eventAction: 'Home_Classified_Ad_Reset',
  eventLabel: 'Home_Classified_Ad_Reset'
},
classifiedAdClose:{
  event: 'Click',
  eventCategory: 'Home_Classified_Ad',
  eventAction: 'Home_Classified_Ad_Close',
  eventLabel: 'Home_Classified_Ad_Close'
},
classifiedAdSubmit:{
  event: 'Click',
  eventCategory: 'Home_Classified_Ad',
  eventAction: 'Home_Classified_Ad_Submit',
  eventLabel: 'Home_Classified_Ad_Submit'
},
uploadProductClick:{
  event: 'Click',
  eventCategory: 'Home_Upload_Product',
  eventAction: 'Home_Upload_Product_Click',
  eventLabel: 'Home_Upload_Product_Click'
},
uploadProductSubmit:{
  event: 'Click',
  eventCategory: 'Home_Upload_Product',
  eventAction: 'Home_Upload_Product_Submit',
  eventLabel: 'Home_Upload_Product_Submit'
},
uploadProductReset:{
  event: 'Click',
  eventCategory: 'Home_Upload_Product',
  eventAction: 'Home_Upload_Product_Reset',
  eventLabel: 'Home_Upload_Product_Reset'
},
uploadProductPreview:{
  event: 'Click',
  eventCategory: 'Home_Upload_Product',
  eventAction: 'Home_Upload_Product_Preview',
  eventLabel: 'Home_Upload_Product_Preview'
},
// addToCartSendMessage:{
//   event: 'Click',
//   eventCategory: 'Send Message',
//   eventAction: 'click',
//   eventLabel: 'Send Message'
// },
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
  'dimension2':'',
  'dimension3':'',
  'dimension4':'',
  'dimension5':''
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
  'dimension2':'',
  'dimension3':'',
  'dimension4':'',
  'dimension5':''
},
addToCart:{
  'name': '',
  'id': '',
  'price': '',
  'brand': '',
  'category': '',
  'quantity': 1
},
removeToCart:{
  event: 'Click',
  eventCategory: 'Remove To Cart',
  eventAction: 'Remove',
  eventLabel: ''
},
toBuyContact:{
  event: 'Click',
  eventCategory: 'Product_ToBuyContact',
  eventAction: 'Product_ToBuyContact_Click',
  eventLabel: 'Product_ToBuyContact_Click'
},
calculateNow:{
  event: 'Click',
  eventCategory: 'Product_Rent_CalculateNow',
  eventAction: 'Product_Rent_CalculateNow_Click',
  eventLabel: 'Product_Rent_CalculateNow_Click'
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
  'id': '',
  'price': '',
  'brand': '',
  'category': '',
  'metric1' : '',
  'quantity': 1
},
basicInformation:{
  event: 'Click',
  eventCategory: '',
  eventAction: 'Click',
  eventLabel: ''
},
imageview:{
  event: 'Click',
  eventCategory: 'Product_Images',
  eventAction: 'Click',
  eventLabel: ''
},
senndSMS:{
  event: 'Click',
  eventCategory: 'Send Message',
  eventAction: 'Click'
  // dimension2:'',
  // dimension5:'',
  // dimension6:''
},
shippingSubmitTime: {
    hitType: 'timing',
    timingCategory: 'Services_Shipping',
    timingVar: 'Services_Shipping_Submit',
    timingLabel: 'Services_Shipping_Submit',
    timingValue: ''
},
shippingResetTime: {
    hitType: 'timing',
    timingCategory: 'Services_Shipping',
    timingVar: 'Services_Shipping_Reset',
    timingLabel: 'Services_Shipping_Reset',
    timingValue: ''
},
valuationSubmitTime: {
    hitType: 'timing',
    timingCategory: 'Services_Valuation',
    timingVar: 'Services_Valuation_Submit',
    timingLabel: 'Services_Valuation_Submit',
    timingValue: ''
},
valuationResetTime: {
    hitType: 'timing',
    timingCategory: 'Services_Valuation',
    timingVar: 'Services_Valuation_Reset',
    timingLabel: 'Services_Valuation_Reset',
    timingValue: ''
},
certifiedbyiquippoSubmitTime: {
    hitType: 'timing',
    timingCategory: 'Services_certifiedbyiquippo',
    timingVar: 'Services_certifiedbyiquippo_Submit',
    timingLabel: 'Services_certifiedbyiquippo_Submit',
    timingValue: ''
},
certifiedbyiquippoResetTime: {
    hitType: 'timing',
    timingCategory: 'Services_certifiedbyiquippo',
    timingVar: 'Services_certifiedbyiquippo_Reset',
    timingLabel: 'Services_certifiedbyiquippo_Reset',
    timingValue: ''
},
manpowerSubmitTime: {
    hitType: 'timing',
    timingCategory: 'Services_manpower',
    timingVar: 'Services_manpower_Submit',
    timingLabel: 'Services_manpower_Submit',
    timingValue: ''
},
manpowerResetTime: {
    hitType: 'timing',
    timingCategory: 'Services_manpower',
    timingVar: 'Services_manpower_Reset',
    timingLabel: 'Services_manpower_Reset',
    timingValue: ''
},
uploadProductSubmitTime: {
    hitType: 'timing',
    timingCategory: 'Home_Upload_Product',
    timingVar: 'Home_Upload_Product_Submit',
    timingLabel: 'Home_Upload_Product_Submit',
    timingValue: ''
},
uploadProductResetTime: {
    hitType: 'timing',
    timingCategory: 'Home_Upload_Product',
    timingVar: 'Home_Upload_Product_Reset',
    timingLabel: 'Home_Upload_Product_Reset',
    timingValue: ''
},
uploadProductPreviewTime: {
    hitType: 'timing',
    timingCategory: 'Home_Upload_Product',
    timingVar: 'Home_Upload_Product_Preview',
    timingLabel: 'Home_Upload_Product_Preview',
    timingValue: ''
},
classifiedAdResetTime: {
    hitType: 'timing',
    timingCategory: 'Home_Classified_Ad',
    timingVar: 'Home_Classified_Ad_Reset',
    timingLabel: 'Home_Classified_Ad_Reset',
    timingValue: ''
},
classifiedAdSubmitTime: {
    hitType: 'timing',
    timingCategory: 'Home_Classified_Ad',
    timingVar: 'Home_Classified_Ad_Submit',
    timingLabel: 'Home_Classified_Ad_Submit',
    timingValue: ''
},
quickQueryCloseTime: {
    hitType: 'timing',
    timingCategory: 'Home_QuickQuery',
    timingVar: 'Home_QuickQuery_Close',
    timingLabel: 'Home_QuickQuery_Close',
    timingValue: ''
},
quickQuerySubmitTime: {
    hitType: 'timing',
    timingCategory: 'Home_QuickQuery',
    timingVar: 'Home_QuickQuery_Submit',
    timingLabel: 'Home_QuickQuery_Submit',
    timingValue: ''
}
};
