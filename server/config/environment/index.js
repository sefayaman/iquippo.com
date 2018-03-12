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
    session: 'mean1-secret@#$sv',
    extSession:'iquippo-ext@#$sv'
  },

  // List of user roles
  userRoles: ['customer', 'user','enterprise','channelpartner','admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  google: {
    clientID: "408562441208-t4ulp2ro7b5qiti5b8bfm3lorvldm589.apps.googleusercontent.com",
    clientSecret: process.env.GOOGLE_SECRET || 'sMG9pd85gQ520VVhh_FjQPVN',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/google/callback'
  },
  facebook: {
    clientID:    "1144004112307890",
    clientSecret:"bfb1123f4f6d548fa2a8751a1e009488",
    callbackURL:  (process.env.DOMAIN || '') + '/auth/facebook/callback'
  },
  twitter: {
    clientID:    "mHXky7ESaikENzjQ1GVKWXdu7",
    clientSecret:"RZLEPjvduP8l0u4MYEgt6jOnmIDxlseqOiJ4ThfD9o7XiHBvDM",
    callbackURL:  (process.env.DOMAIN || '') + '/auth/twitter/callback'
  },
  linkedIn: {
    clientID:    "75z3xqeyc2omxj",
    clientSecret:"HPFwYtCUt46A0LbV",
    callbackURL:  (process.env.DOMAIN || '') + '/auth/linkedin/callback'
  },
  importDir:"import",
  awsBucketPrefix : "/assets/uploads/"
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
