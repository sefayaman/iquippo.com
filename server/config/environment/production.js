'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip:       process.env.OPENSHIFT_NODEJS_IP ||
            process.env.IP ||
            undefined,

  // Server port
  port:     process.env.OPENSHIFT_NODEJS_PORT ||
            process.env.PORT ||
            9010,
  
  // MongoDB connection options
  mongo: {
    uri:    process.env.MONGOLAB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.OPENSHIFT_MONGODB_DB_URL+process.env.OPENSHIFT_APP_NAME ||
            //'mongodb://localhost/sreiglobaldb'
            'mongodb://uatdb1.iquippo.com,uatdb2.iquippo.com,uatdb3.iquippo.com/sreiglobaldb'
  },
  uploadPath: "./../public/assets/uploads/",
  templatePath:'./../public/assets',
  contactNumber: "011 66025672",
  //serverPath: "http://54.255.186.7:9010"
  serverPath: "https://iquippo.com",
  ccAvenueWorkingKey:"4B309EB35A3F3C9F903427AB11E062EE",
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "no-reply@iquippo.com", Mailpassword: "welcome@123",from:"info@iquippo.com"},
  qpvalURL:"http://quippoauctions.com/valuation/api.php",
  REDIRECT_URL:"https://finance.iquippo.com/customer-portal-iquippo/sso",
  //S3 Configuration
  awsEndpoint: 's3.ap-south-1.amazonaws.com',
  awsAccessKeyId: 'AKIAIEW6UDFVW7GEQAGQ',
  awsSecretAccessKey: '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',
  awsBucket: 'iquippo-image-upload',
  awsUrl: 'https://s3.ap-south-1.amazonaws.com/',
  
  auctionURL:"https://auctionsoftwaremarketplace.com:3007/api_call/"
};
