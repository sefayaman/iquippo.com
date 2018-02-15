'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://127.0.0.1/sreiglobaldb'
  },
  uploadPath: 'client/assets/uploads/',
  templatePath:'client/assets',
  //serverPath: "http://192.168.14.120", 
  serverPath: "http://dev.iquippo.com",
  contactNumber: "011 66025672",
  ccAvenueWorkingKey:"CC6D430E8604D39EA9EDCABADF26BE4B",

  seedDB: true,
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"iquippo.uat@gmail.com"},
  supportMail: "iquippo.uat@gmail.com",
  qpvalURL:"http://13.126.19.255/Valuers/api.php",
  REDIRECT_URL:"http://finance-uat.iquippo.com/customer-portal-iquippo/sso",

  awsEndpoint: 's3.ap-south-1.amazonaws.com',
  awsAccessKeyId: 'AKIAIEW6UDFVW7GEQAGQ',
  awsSecretAccessKey: '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',
  awsBucket: 'iquippo-image-upload-dev',
  awsUrl: 'https://s3.ap-south-1.amazonaws.com/',

  auctionURL:"https://auctionsoftwaremarketplace.com:3007/api_call/"
};
