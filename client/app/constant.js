var Modals = {
  login:{
    tplUrl:"app/account/login/login.html",
    Ctrl:'LoginCtrl'
  },
   signup:{
    tplUrl:"app/account/signup/signup.html",
    Ctrl:'SignupCtrl'
  },
  settings:{
    tplUrl:"app/account/settings/settings.html",
    Ctrl:'SettingsCtrl'
  },
  callback:{
    tplUrl:"app/callback/callback.html",
    Ctrl:'CallbackCtrl'
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
    Ctrl:'ForgotPasswordCtrl'
  },
  classifiedad:{
     tplUrl:"app/classifiedaddes/classifiedadd.html",
    Ctrl:'ClassifiedAdCtrl'
  },
  shippingquote:{
    tplUrl:"app/staticpages/shippingquote.html",
    Ctrl:'ShippingCtrl'
  },
  valuationquote:{
    tplUrl:"app/staticpages/valuationquote.html",
    Ctrl:'ValuationCtrl'
  },
  certifiedbyiquippoquote:{
    tplUrl:"app/staticpages/certifiedbyiquippoquote.html",
    Ctrl:'CetifiedByiQuippoCtrl'
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
    "name" : "Afghanistan",
    "code" : "AF"
},
{
    "name" : "Azerbaijan",
    "code" : "AZ"
},
{
    "name" : "Bahrain",
    "code" : "BH"
},
{
    "name" : "Belgium",
    "code" : "BE"
},
{
    "name" : "China",
    "code" : "CN"
},
{
    "name" : "Ethiopia",
    "code" : "ET"
},
{
    "name" : "France",
    "code" : "FR"
},
{
    "name" : "Hong Kong",
    "code" : "HK"
},
{
    "name" : "India",
    "code" : "IN"
},
{
    "name" : "Indonesia",
    "code" : "ID"
},
{
    "name" : "Japan",
    "code" : "JP"
},
{
    "name" : "Kazakhstan",
    "code" : "KZ"
},
{
    "name" : "Kenya",
    "code" : "KE"
},
{
    "name" : "Kuwait",
    "code" : "KW"
},
{
    "name" : "Mongolia",
    "code" : "MN"
},
{
    "name" : "Myanmar",
    "code" : "MM"
},
{
    "name" : "Nigeria",
    "code" : "NG"
},
{
    "name" : "Oman",
    "code" : "OM"
},
{
    "name" : "Qatar",
    "code" : "QA"
},
{
    "name" : "Russian Federation",
    "code" : "RU"
},
{
    "name" : "Saudi Arabia",
    "code" : "SA"
},
{
    "name" : "Singapore",
    "code" : "SG"
},
{
    "name" : "South Africa",
    "code" : "ZA"
},
{
    "name" : "Turkmenistan",
    "code" : "TM"
},
{
    "name" : "United Arab Emirates",
    "code" : "AE"
},
{
    "name" : "Uganda",
    "code" : "UG"
},
{
    "name" : "United Kingdom",
    "code" : "GB"
},
{
    "name" : "United Republic of Tanzania ",
    "code" : "TZ"
},
{
    "name" : "Uzbekistan",
    "code" : "UZ"
},
{
    "name" : "Yemen",
    "code" : "YE"
}
];

var serverPath = location.protocol +"//" + location.host; 
//var serverPath = "http://14.141.64.180:8100"; 
//var supportMail = "info@auro.world";
var supportMail = "bharat.hinduja@bharatconnect.com";
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









