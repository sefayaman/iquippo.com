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
  },
  valuationReq:{
    tplUrl:"app/valuation/valuationrequest.html",
    Ctrl:'ValuationRequestCtrl as valuationReqVm'
  },
  biddingReq:{
    tplUrl:"app/bidValue/bidnow.html",
    Ctrl:'BidCtrl as bidVm'
  },
  inputFormReq:{
    tplUrl:"app/inputform/inputformpopup.html",
    Ctrl:'InputFormCtrl as inputFormVm'
  },
  bannerLeads:{
    tplUrl:"app/main/bannerleads.html",
    Ctrl:'BannerLeadCtrl as bannerLeadVm'
  },
  locationList : {
    tplUrl : "app/spare/locationList.html",
    Ctrl : 'SpareUploadCtrl as spareVm'
  },
  auctionRegistration : {
    tplUrl : "app/auction/userregisterforauction.html",
    Ctrl : 'userRegForAuctionCtrl as auctionRegVm'
  },
  auctionRegislogin : {
    tplUrl : "app/auction/auctloginregis.html",
    Ctrl : 'AuctionRegisCtrl as auctionRegisVm'
  },
  invoiceDetails : {
    tplUrl : "app/assetsale/invoicedetails.html",
    Ctrl : 'invoiceDetailsCtrl as invoiceDetailsVm'
  },
  kycDocument : {
    tplUrl : "app/assetsale/kycDocument.html",
    Ctrl : 'kycDocumentCtrl as kycDocumentVm'
  },
  feedbackForm : {
    tplUrl : "app/assetsale/feedbackForm.html",
    Ctrl : 'feedbackCtrl as feedbackVm'
  },
  selectPaymentType : {
    tplUrl : "app/assetsale/selectpaymenttype.html",
    Ctrl : 'SelectPaymentCtrl as paymentVm'
  },
  emdFullPaymentPopup : {
    tplUrl : "app/assetsale/emdFullPaymentDetail.html",
    Ctrl : 'EmdFullPaymentCtrl as emdFullPaymentVm'
  },
  bidProductDetailPopup : {
    tplUrl : "app/assetsale/bidproductdetail.html",
    Ctrl : 'BidRequestDetailCtrl as bidReqDetailVm'
  },
  productRequestDetailPopup : {
    tplUrl : "app/assetsale/productbidrequestdetail.html",
    Ctrl : 'BidRequestDetailCtrl as bidReqDetailVm'
  },
  buyerRequestDetailPopup : {
    tplUrl : "app/assetsale/buyerrequestdetail.html",
    Ctrl : 'ViewProductOrRequestDetailCtrl as reqDetailVm'
  },
  bidRequest:{
    tplUrl:'app/assetsale/assetbidpopup.html',
    Ctrl:'AssetBidPopUpCtrl as assetBidPopUpVm'
  },
  DoUpload:{
    tplUrl:'app/assetsale/doupload.html',
    Ctrl:'DoUploadCtrl as doUploadVm'
  },
  OfflinePaymentPopup:{
    tplUrl:'app/payment/offlinepayment.html',
    Ctrl:'OfflinePaymentCtrl as offlinePaymentVm'
  },
  valuationInvoiceCalcuation:{
    tplUrl:'app/enterprise/invoicecalculation.html',
    Ctrl:'InvoiceCalculationCtrl as invoiceCalculationVm'
  },
  paymentOption : {
    tplUrl : "app/valuation/paymentoption.html",
    Ctrl : 'PaymentOptionCtrl as paymentOptVm'
  },
  individualValuationInvoiceCalcuation:{
    tplUrl:'app/enterprise/invoicecalculation.html',
    Ctrl:'IndividualInvoiceCalculationCtrl as invoiceCalculationVm'
  }
};

var s3Detais = {
    baseURL : "https://s3.ap-south-1.amazonaws.com",
    s3bucket : "iquippo-image-upload-dev"
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

var expValue = [
{
  name:" 0 - 1 yr",
  value:1
},
{
  name:" 1 - 3 yr",
  value:3
},
{
  name:" 3 - 5 yr",
  value:5
},
{
  name:" 5 + yr",
  value:"plus"
}
];

var importDir = "import";
var categoryDir = "category";
var manpowerDir = "manpower";
var avatarDir = "avatar";
var kycDocDir = "kyc";
var classifiedAdDir = "classifiedad";
var manufacturerDir = "manufacturer";
var bannerDir = "banner";
var auctionmasterDir="auctionmaster";
var financemasterDir="financemaster";
var choosenTitle="";
var metaDescription="";
var metaKeywords = "";

var templateDir = "templates";
var auctionDir = "auction"
var tempDir = "temp";
var newsEventsDir = "newsevents";
var UPLOAD_TEMPLATE_KEY = "BULK_PRODUCT_UPLOAD_TEMPLATE";
var UPDATE_INVITATION_MASTER = "Update_Invitation_Master";
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
];

var modeOfPayment = [
{
  name:"Cash",
},
{
  name:"Cheque",
},
{
  name:"DD",
},
{
  name:"RTGS",
},
{
  name:"NEFT",
}
];

var paymentOptions = [
  "Online",
  "Offline",
  "COD"
];

var spareStatus = [
{
  name:"Active",
  code:"active"
},
{
  name:"Inactive",
  code:"inactive"
},
{
  name:"Sold",
  code:"sold"
}
];

var KYCType = [
{
  name:"Address Proof",
  code:"address_proof"
},
{
  name:"Identity Proof",
  code:"identity_proof"
},
{
  name:"Other Document",
  code:"other_document"
}
];

var auctionStatuses = [
  {
    name:"Payment Pending",
    code:"payment_pending",
    notificationText : "pending"
  },
  {
    name:"Request Submitted",
    code:"request_submitted",
    notificationText : "submitted"
  },
  {
    name:"Request Approved",
    code:"request_approved",
    notificationText : "approved"
  },
  {
    name:"Request Rejected",
    code:"request_rejected",
    notificationText : "rejected"
  },
  {
    name:"Refund Initiated",
    code:"refund_initiated",
    notificationText : "refund initiated"
  },
  {
    name:"Listed In Auction",
    code:"Listed_in_auction",
    notificationText : "listed"
  }
];
var IndividualValuationStatuses = ['Request Initiated','Payment Completed','Request Failed','Request Submitted','Invoice Generated','Valuation Report Failed','Valuation Report Submitted','Completed', 'Cancelled'];
var iqvlOtherGroupId = 6;
var valuationStatuses = [
{
    name:"Payment Pending",
    code:"payment_pending",
    notificationText : "pending"
},
{
  name:"Valuation Request Listed",
  code:"request_listed",
  notificationText : "listed"
},
{
  name:"Valuation Request Approved",
  code:"request_approved",
   notificationText : "approved"
},
{
  name:"Valuation Request Submitted",
  code:"request_submitted",
  notificationText : "submitted"
},
{
  name:"Valuation in process",
  code:"request_in_process",
   notificationText : "in progress"
},
{
  name:"Valuation Report Uploaded",
  code:"request_completed",
  notificationText:"completed"
}
];

var transactionStatuses = [

{
  name:"Listed",
  code:"listed"
},
{
  name:"Pending",
  code:"pending"
},
{
  name:"Failed",
  code:"failed"
},
{
  name:"Rejected",
  code:"rejected"
},
{
  name:"Retried",
  code:"retried"
},
{
  name:"Completed",
  code:"completed"
}
];

//var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner','Completed'];
var EnterpriseValuationStatuses = ['Request Initiated','Request Failed','Request Submitted','Inspection In Progress','Inspection Completed','Valuation Report Failed','Valuation Report Submitted','Invoice Generated','Payment Received','Payment Made to valuation Partner','Completed'];
var ReqSubmitStatuses = ['Request Submitted', 'Request Failed'];
var TaxList =  ["Service Tax","Swatch Bharat Cess","Krishi Kalyan Cess"];

var offerStatuses=['Bid Received','Bid Changed','Bid Withdraw'];

var dealStatuses=['Decision Pending','Offer Rejected','Cancelled','Rejected-EMD Failed','Rejected-Full Sale Value Not Realized','Bid-Rejected','Approved','EMD Received','Full Payment Received','DO Issued','Asset Delivered','Acceptance of Delivery','Closed'];
var bidStatuses=['In Progress','Cancelled','Bid Lost','EMD Failed','Full Payment Failed','Auto Rejected-Cooling Period','Rejected','Accepted','Auto Accepted'];
var tradeTypeStatuses = ['Sell','Both','NOT_AVAILABLE'];

var StatusChangeConfirmationMsg = {
  approve : "Do you want to Approve this bid?",
  reject : "Do you want to Reject this bid?",
  doissued : "You are issueing  DO for this bid?.",
  deliverd:"You are giving delivery date?.",
  deliveryaccept:"You are confirming the asset delivery."
}

var tradeType = [
/*{
  "name" : "Rent",
  "code" : "RENT"
},*/
{
  "name" : "Sell",
  "code" : "SELL"
}/*,
{
  "name" : "Both",
  "code" : "BOTH"
}*/
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

var allMadeInCountries = [
{
    "name" : "India",
    "code" : "IN"
},
{
    "name" : "China",
    "code" : "CN"
},
{
    "name" : "Germany",
    "code" : "DE"
},
{
    "name" : "Singapore",
    "code" : "SG"
},
{
    "name" : "Taiwan",
    "code" : "TW"
},
{
    "name" : "Malaysia",
    "code" : "MY"
},
{
    "name" : "Japan",
    "code" : "JP"
},
{
    "name" : "Korea",
    "code" : "KR"
},
{
    "name" : "Hong Kong",
    "code" : "HK"
},
{
    "name" : "United Kingdom",
    "code" : "UK"
},
{
    "name" : "United States",
    "code" : "US"
},
{
    "name" : "Bangladesh",
    "code" : "BD"
}
];
var payableServices = [
{
  name:"Auction Listing",
  code:"Auction",
  multiple:false
},
{
  name:"Valuation Service",
  code:"Valuation",
  multiple:true
},
{
  name:"Asset Inspection",
  code:"Inspection",
  multiple:true
}
];
var HOME_BANNER =  [{
      webImg: 'Banner.jpg',
      default:true
    }, {
      webImg: 'Banner1.jpg',
      default:true
    }, {
      webImg: 'Banner2.jpg',
      default:true
    }, {
      webImg: 'Banner3.jpg',
      default:true
    }, {
      webImg: 'Banner4.jpg',
      default:true
    }];

var serverPath = location.protocol +"//" + location.host; 
var auctionURL = "https://auctions.iquippo.com"
//var serverPath = "http://14.141.64.180:8100"; 
var supportMail = "info@iquippo.com";
var DevEnvironment = false; 
var supportContact = "011 66025672";
/*for payment gateway */
var ccavenueURL = "https://secure.ccavenue.com";
var currentURL = "https://iquippo.com";
var accessCode = 'AVSY67DJ29AL34YSLA';
/*if(location.host.indexOf('iquippo.com') == -1){
  supportMail = "iquippo.uat@gmail.com";
  DevEnvironment = true;
}*/

var informationMessage = {};
informationMessage['unknownError'] = "There is some issue.Please contact our support team.";

/*callback message*/
informationMessage['callbackSuccess'] = "We have received your Call Back request. One of our executives will contact you soon. Thank you.";

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
informationMessage['buyRequestSuccess'] = "Your request has been submitted successfully!";
informationMessage['productUpdateMessage'] = "This operation will make product inactive and needs administrator approval for activation. Do you want to continue?";

/*vendor registration messages */
informationMessage['vendorSuccess'] = "Your have been successfully register!";

/*classifiedadd messages*/
informationMessage['classifiedSuccess'] = "Your request for Classified Ad has been successfully received.";

/*channel partner messsage */
informationMessage['deleteChannelPartnerConfirm'] = "Do you want to delete this user?";

/*otp message*/
informationMessage['otpMessage'] = 'Dear User, One Time Password (OTP) to verify your iQuippo account is ';

/*Asset Sale messages*/
//informationMessage['buyNowApprovalIfYes'] = "Your Bid request has been submitted successfully.";
//informationMessage['buyNowApprovalIfNo'] = "Your Sale process is in process , you may contact us at 03366022059";
//informationMessage['buyNowApprovalIfNoForNextUser'] = "Someone else has already submitted the before you , in case of his cancellation you will be getting the same , You may Contact us at 03366022059";
informationMessage['changeBid'] = "You are changing your existing bid. Proceed?";
informationMessage['submitBid'] = "Do you want to submit your bid?";
informationMessage['higherBidMsg'] = "A higher bid is available for this asset. Do you want to change your Bid?";
informationMessage['partialEMD'] = "Partial EMD payment details submitted successfully.";
informationMessage['partialFullpayment'] = "Partial Payment details submitted successfully.";
informationMessage['EMDPayment'] = "EMD Payment has been received. Kindly pay the full payment as per schedule.";
informationMessage['Fullpayment'] = "Full payment has been received.";
informationMessage['kycUpdate'] = "KYC Documents uploaded successfully.";
informationMessage['invoiceUpdateForSelf'] = "Invoice in your name has been submitted successfully.";
informationMessage['invoiceUpdateForThirdParty'] = "Invoice in third party's name has been submitted successfully.";

/*Auction messages*/
informationMessage['auctionRegMsg'] = "You have already registered for this auction.";
informationMessage['auctionPaymentPendingMsg'] = 'Your EMD payment is still pending. For paying EMD amount, go to Payment History in your dashboard.';
informationMessage['auctionPaymentSuccessMsg'] = "You have sucessfully registered for the auction. Please pay the EMD amount and inform our customer care team.";

var newsEvents = [
  {
    name:"The Economic Times",
    //image:"The_Economic_Times.jpg"
    image:"The_Economic_Times.PNG"
  },
  {
    name:"The Hindu Business Line",
    //image:"The_Hindu_Business_Line.jpg"
    image:"The_Hindu_Business_Line_1.jpg"
  },
  {
    name:"The Financial Express",
    image:"The_Financial_Express.jpg"
  },
  {
    name:"Financial Chronicle",
    image:"Financial_Chronicle.jpg"
  },
  {
    name:"The Times of India",
    image:"The_Times_of_India.jpg"
  },
  {
    name:"The Telegraph",
    image:"The_Telegraph.jpg"
  },
  {
    name:"DNA",
    image:"DNA.jpg"
  },
  {
    name:"The Echo of India",
    image:"The_Echo_of_India.jpg"
  },
  {
    name:"The Statesman",
    image:"The_Statesman.jpg"
  },
  {
    name:"Orissa Today",
    image:"Orissa_Today.jpg"
  },
  {
    name:"Duniya Khabar",
    image:"Duniya_Khabar.jpg"
  },
  {
    name:"Financial Explorer",
    image:"Financial_Explorer.jpg"
  },
  {
    name:"J & K Newspoint",
    image:"J&K_Newspoint.jpg"
  },
  {
    name:"The Northlines",
    image:"The_Northlines.jpg"
  },
  {
    name:"Mercury Times",
    image:"Mercury_Times.jpg"
  },
  {
    name:"Shankhdhun",
    image:"Shankhdhun.jpg"
  },
  {
    name:"Dogra Herald",
    image:"Dogra_Herald.jpg"
  },
  {
    name:"Sanmarg",
    image:"Sanmarg.jpg"
  },
  {
    name:"Rajasthan Patrika",
    image:"Rajasthan_Patrika.jpg"
  },
  {
    name:"Dainik Vishwamitra",
    image:"Dainik_Vishwamitra.jpg"
  },
  {
    name:"Chaapte Chaapte",
    image:"Chaapte_Chaapte.jpg"
  },
  {
    name:"Dakshin Mumbai",
    image:"Dakshin_Mumbai.jpg"
  },
  {
    name:"Dabang Duniya",
    image:"Dabang_Duniya.jpg"
  },
  {
    name:"Navshakti",
    image:"Navshakti.jpg"
  },
  {
    name:"Kalinga Bharti",
    image:"Kalinga_Bharti.jpg"
  },
  {
    name:"Arthhik Lipi",
    image:"Arthhik_Lipi.jpg"
  },
  {
    name:"Aajkal",
    image:"Aajkal.jpg"
  },
  {
    name:"Kalantar",
    image:"Kalantar.jpg"
  },
  {
    name:"Mumbai Chaufer",
    image:"Mumbai_Chaufer.jpg"
  },
  {
    name:"Vaartha",
    image:"Vaartha.jpg"
  },
  {
    name:"Munsif Daily",
    image:"Munsif_Daily.jpg"
  }
  
]

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
  eventLabel: ''
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
classifiedAdCloseTime: {
    hitType: 'timing',
    timingCategory: 'Home_Classified_Ad',
    timingVar: 'Home_Classified_Ad_Close',
    timingLabel: 'Home_Classified_Ad_Close',
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
},
EquipmentSearchProductBrand:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_ProductBrand',
  eventAction: 'dropDownChange',
  eventLabel: ''
},
EquipmentSearchProductModel:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_ProductModel',
  eventAction: 'dropDownChange',
  eventLabel: ''
},
EquipmentSearchProductSubCategory:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_SubCategory',
  eventAction: 'dropDownChange',
  eventLabel: ''
},
EquipmentSearchProductCategory:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_Category',
  eventAction: 'dropDownChange',
  eventLabel: ''
},
EquipmentSearchProductGroup:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_ProductGroup',
  eventAction: 'dropDownChange',
  eventLabel: ''
},
EquipmentSearchTradingType:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_TradingType',
  eventAction: 'dropDownChange',
  eventLabel: ''
},
EquipmentSearchAssetStatus:{
  event: 'Click',
  eventCategory: 'EquipmentSearch_AssetStatus',
  eventAction: 'dropDownChange',
  eventLabel: ''
}
};
