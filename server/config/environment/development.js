'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://iquippo_user:1quipp0123@localhost/sreiglobaldb'
  },
  uploadPath: 'client/assets/uploads/',
  serverPath: "http://192.168.14.120:8100",
  contactNumber: "011 66025672",

  seedDB: true,
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"info@iquippo.com"}
};
