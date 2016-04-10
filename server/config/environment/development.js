'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/sreidubaidb'
  },
  uploadPath: 'client/assets/uploads/',
  serverPath: "http://192.168.14.120:8100",

  seedDB: true
};
