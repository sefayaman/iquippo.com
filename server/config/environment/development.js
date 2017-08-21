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
  serverPath: "http://192.168.14.120",
  contactNumber: "011 66025672",
  ccAvenueWorkingKey:"BCCD36E2D20659D5F76B99973880340D",

  seedDB: true,
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"info@iquippo.com"},
  qpvalURL:"http://13.126.19.255/valuation/api.php?type=Mjobcreation",
  REDIRECT_URL:"http://finance-uat.iquippo.com/customer-portal-iquippo/sso"
};
