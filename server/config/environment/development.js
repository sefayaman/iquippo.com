'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://appUser:iQuippoAppUser^*$!2K17@127.0.0.1/sreiglobaldb'
  },
  appDomain: 'http://localhost:8100/',
  uploadPath: 'client/assets/uploads/',
  templatePath:'client/assets',
  //serverPath: "http://192.168.14.120", 
  contactNumber: "011 66025672",
  
  /*Dev server payment setup*/
  serverPath: "http://dev.iquippo.com",
  ccAvenueWorkingKey:"CC6D430E8604D39EA9EDCABADF26BE4B",

   /*Localhost server payment setup*/
  //serverPath: "http://localhost",
  //ccAvenueWorkingKey:"BCCD36E2D20659D5F76B99973880340D",

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
  S3_HEADER_EXPIRES: new Date(Date.now() + 604800000).toISOString(),
  S3_HEADER_CACHE_CONTROL: 'maxAge=2592000',

  auctionURL:"https://auctionsoftwaremarketplace.com:3007/api_call/"
};
