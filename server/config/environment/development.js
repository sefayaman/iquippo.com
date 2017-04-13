'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://iquippo_user:1quipp0123@127.0.0.1/sreiglobaldb'
  },
  uploadPath: 'client/assets/uploads/',
  templatePath:'client/assets',
  serverPath: "http://192.168.14.120",
  contactNumber: "011 66025672",

  seedDB: true,
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"info@iquippo.com"}
};
