'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://appUser:iQuippoAppUser^*$!2K17@127.0.0.1:28018/sreiglobaldb'
  },
  uploadPath: 'client/assets/uploads/',
  templatePath:'client/assets',
  serverPath: "http://192.168.14.120",
  contactNumber: "011 66025672",
  ccAvenueWorkingKey:"BCCD36E2D20659D5F76B99973880340D",

  seedDB: true,
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"info@iquippo.com"},
  qpvalURL:"http://13.126.19.255/valuation/api.php?type=Mjobcreation",
  REDIRECT_URL:"http://finance-uat.iquippo.com/customer-portal-iquippo/sso",

  awsEndpoint: 's3.ap-south-1.amazonaws.com',
  awsAccessKeyId: 'AKIAIEW6UDFVW7GEQAGQ',
  awsSecretAccessKey: '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',
  awsBucket: 'iquippo-image-upload-dev',
  awsUrl: 'https://s3.ap-south-1.amazonaws.com/'
  
};
