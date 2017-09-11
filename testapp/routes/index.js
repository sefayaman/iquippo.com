var express = require('express');
var router = express.Router();
var request=require("request"); 

/* GET home page. */
router.get('/', function(req, res, next) {
	var temp = new Date();
	  var auctionsData=[{
    //"_id" : "59af77f012667780104fffe1",
    "name" : "RockSteel",
    "auctionId" : "5680",
    "startDate":"2017-09-13T04:21:00.000Z",
    "endDate" : "2017-09-16T04:21:00.000Z",
    "auctionOwnerMobile" : "8697733634",
    "insStartDate" : "2017-09-09T04:21:00.000Z",
    "insEndDate" : "2017-09-12T04:21:00.000Z",
    "regEndDate" : "2017-09-11T18:30:00.000Z",
    "city" : "Allahabad",
    "auctionType" : "A",
    "emdTax" : "lotWise",
    "taxApplicability" : "included",
    "bidIncrement" : 10000,
    "lastMinuteBid" : 45,
    "extendedTo" : 60,
    "auctionOwner" : "Balaji Andhavarapu",
    "state" : "Uttar Pradesh",
    "updatedAt" : "2017-09-06T04:22:08.634Z",
    "createdAt" : "2017-09-06T04:22:08.634Z" 
}];
var  auctions=JSON.stringify(auctionsData);
var tempo = {
	"auctions":auctions
};
request.post({
	url:"http://auctionsoftwaremarketplace.com:3007/api_call/new-auction",
	form:tempo
},function(err,res,data){
	if(err) throw err;
	// console.log("response",
//data= JSON.parse(data);
console.log(data);
});
});

router.get('/lot', function(req, res, next) {
	var temp = new Date();
	  var lotData=[
    // {"_id" : "59ae41ab7e1bc33158217363",
    {
    //"_id" :"59af9f376608dfb14c3a3b10",
    "userId":"589183a407ca290e48df2b1f",
    //"_id" : "59af9f246608dfb14c3a3b0e"),
    "lotNumber" : "46",
    "startingPrice" : 56000,
    "assetId" : "1502690241346",
    "assetDesc" : "",
    "auctionId" : "5680",
    "reservePrice" : 0,
    "updatedAt" : "2017-09-06T07:09:24.895Z",
    "createdAt" : "2017-09-06T07:09:24.895Z"
    // "updatedAt" : temp,
    // "createdAt" : temp
}];
var  lotData=JSON.stringify(lotData);
var data = {
	"lots":lotData
};
request.post({
	url:"http://auctionsoftwaremarketplace.com:3007/api_call/new-lots",
	form:data
},function(err,httpres,data){
	if(err){
      console.log(err); 
    } else{
      data = JSON.parse(data);
      res.json(data);
    }
});
});

router.get('/lots',function(req,res,next){
var lotdet = [{
  "userId":"599a90ec91925b3513395687",
  "lotNumber":"adsa",
  "auctionId":"afdasdfasdfafasdfasdfasfasdfasd",
  "assetId":"asset10",
  "assetDesc":"sorry bro",
  "startingPrice":"100",
  "reservePrice":"1000"
},{
  "userId":"sandeep",
  "lotNumber":"asdasda",
  "auctionId":"afdasdfasdfafasdfasdfasfasdfasd",
  "assetId":"asset11",
  "assetDesc":"this is also another test lot",
  "startingPrice":"200",
  "reservePrice":"2000"
}
];

lotdet = JSON.stringify(lotdet);
var data = {
  "lots" : lotdet
}
  request.post({
    url:"http://auctionsoftwaremarketplace.com:3007/api_call/new-lots",
    form:data
  },function(error,httpResponse,data){
    if(error){
      console.log(error)
    } else{
      data = JSON.parse(data);
      res.json(data)
    }
  });
});

router.get('/user', function(req, res, next) {
	var temp = new Date();
	  var userData=
    // {"_id" : "59ae41ab7e1bc33158217363",
    {
    "_id" : "596db5e0005b85184c791d43",
    "updatedAt" : temp,
    "createdAt" : temp,
     "mname":"abd",
    "email":"abc@gmail.com",
    "phone":"9717017982",
    "address":"adbv",
    "company":"hfjfj",
    "location":"singapore Malaysia",
    "fname" : "Polish",
    "lname" : "Panda",
    "hashedPassword" : "hsyfWaJ1j7U3rFqRC1gVDthaqmUAqCsc8c9fJktJQKDuBMrAz7ftd5g9R2fP9hwBoRAdYLTRcw6eYNBE02T3Vw==",
    "salt" : "Lzvg0+O5uWVRuBtMB3BxFw==",
    "country" : "India",
    "state" : "Assam",
    "city" : "Dibrugarh",
    "mobile" : "9717017982",
    "agree" : true,
    "otp" : "795706",
    "isPartner" : false,
    "isManpower" : false,
    "deleted" : false,
    "profileStatus" : "complete",
    "mobileVerified" : true,
    "emailVerified" : false,
    "status" : true,
    "availedServices" : [],
    "role" : "customer",
    "userType" : "individual"
};
//please send dummy values in those required fields. I will change the code for future
//go ahead
//please add those values

// var  userData=JSON.stringify(userData);
// var data = {
// 	"users":userData
// };
request.post({
	url:"http://auctionsoftwaremarketplace.com:3007/api_call/registered-user-update",
	form:userData
},function(err,httpres,data){
	if(err){
      console.log(err); 
    } else{
      data = JSON.parse(data);
      res.json(data);
    }
});
});

module.exports = router;

//done. fire the server now
