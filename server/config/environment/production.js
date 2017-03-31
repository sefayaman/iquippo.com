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
            'mongodb://localhost/sreiglobaldb'
  },
  uploadPath: "./../public/assets/uploads/",
  templatePath:'./../public/assets',
  contactNumber: "011 66025672",
  //serverPath: "http://54.255.186.7:9010"
  serverPath: "http://iquippo.com",
  mailConfig : { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "info@iquippo.com", Mailpassword: "Quippo123#@!",from:"info@iquippo.com"}

};