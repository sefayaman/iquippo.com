'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://127.0.0.1/sreiglobaldb'
  },
  uploadPath: 'client/assets/uploads/',
  serverPath: "http://192.168.14.120:8100",
  contactNumber: "011 66025672",

  seedDB: true
};
