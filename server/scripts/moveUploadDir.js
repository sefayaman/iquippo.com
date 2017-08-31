var fs = require('fs');
var config = require('../config/environment/development');
var path = require('path');
var utility = require('../components/utility.js'); // /server/components/utility.js


console.log("Start Copy assets sub-directories");

/*
 * 
 */
    utility.moveUploadsToS3(config.templatePath ,function(err,res){
        console.log("Copy assets sub-directories to s3.",res, err);
    });
/* 
 * 
 */
