'use strict';
var path = require('path');


module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [{
    name: "iquippo server",
    script: "app.js",
    env: {
      NODE_ENV: process.env.NODE_ENV
    },
    "exec_mode": "fork",
    "instances": 1,
    "error_file": path.join(__dirname, '../../log/', "err.log"),
    "out_file": path.join(__dirname, '../../log/', "out.log"),
    "log_date_format": "YYYY-MM-DD HH:mm Z"
  }]

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  /* deploy : {
     production : {
       user : "node",
       host : "212.83.163.1",
       ref  : "origin/master",
       repo : "git@github.com:repo.git",
       path : "/var/www/production",
       "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env production"
     },
     dev : {
       user : "node",
       host : "212.83.163.1",
       ref  : "origin/master",
       repo : "git@github.com:repo.git",
       path : "/var/www/development",
       "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env dev",
       env  : {
         NODE_ENV: "dev"
       }
     }
   } */
}