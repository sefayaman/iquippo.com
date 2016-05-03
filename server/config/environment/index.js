'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 8100,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'mean1-secret@#$sv'
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  google: {
    clientID: "989503215697-dajf3iluqgp9trp20vqrvrduc5v7v3j2.apps.googleusercontent.com",//process.env.GOOGLE_ID || 'id',
    clientSecret: process.env.GOOGLE_SECRET || 'PhsAWwerGD2bep-qiUxGEAEZ',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/google/callback'
  },
  facebook: {
    clientID:    "270271773315178",
    clientSecret:"f60977ed21f817c39b7bd253d87c4ee1",
    callbackURL:  (process.env.DOMAIN || '') + '/auth/facebook/callback'
  },
  importDir:"import",
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
