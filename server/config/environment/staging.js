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
            'mongodb://appUser:iQuippoAppUser^*$!2K17@newuatdb1.iquippo.com:28018,appUser:iQuippoAppUser^*$!2K17@newuatdb2.iquippo.com:28018,appUser:iQuippoAppUser^*$!2K17@newuatdb3.iquippo.com:28018/sreiglobaldb'
  },
  uploadPath: "./../public/assets/uploads/",
  templatePath:'./../public/assets',
  contactNumber: "011 66025672",
  //serverPath: "http://54.255.186.7:9010"
  serverPath: "http://iquippo.com",
  ccAvenueWorkingKey:"BCCD36E2D20659D5F76B99973880340D",
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"info@iquippo.com"},
  qpvalURL:"http://13.126.19.255/valuation/api.php?type=Mjobcreation",
  REDIRECT_URL:"http://finance-uat.iquippo.com/customer-portal-iquippo/sso",
  awsEndpoint: 's3.ap-south-1.amazonaws.com',
  awsAccessKeyId: 'AKIAIEW6UDFVW7GEQAGQ',
  awsSecretAccessKey: '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',
  awsBucket: 'iquppo-image-upload',
  awsUrl: 'https://s3.ap-south-1.amazonaws.com/'
  

};