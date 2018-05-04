'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://appUser:iQuippoAppUser^*$!2K17@127.0.0.1/sreiglobaldb'
  },
  uploadPath: "./../public/assets/uploads/",
  templatePath:'./../public/assets',
  serverPath: "http://192.168.14.120",
  contactNumber: "011 66025672",
  ccAvenueWorkingKey:"BCCD36E2D20659D5F76B99973880340D",

  seedDB: true,
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"iquippo.uat@gmail.com"},
  qpvalURL:"http://13.126.19.255/valuation/api.php?type=Mjobcreation",
  REDIRECT_URL:"http://finance-uat.iquippo.com/customer-portal-iquippo/sso",

  awsEndpoint: 's3.ap-south-1.amazonaws.com',
  awsAccessKeyId: 'AKIAJFRNQ25NUJFOULUA',
  awsSecretAccessKey: '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',
  awsBucket: 'iquippo-image-upload-dev',
  awsUrl: 'https://s3.ap-south-1.amazonaws.com/',
  
  auctionURL:"https://auctionsoftwaremarketplace.com:3007/api_call/",
   valuationReportFtp :{
    ip:"14.142.134.52",
    port:22,
    username:"nggpsftp",
    password:"Welcome123"
  },
  valuationReportRemotePath:"/home/nggpsftp/"
};
