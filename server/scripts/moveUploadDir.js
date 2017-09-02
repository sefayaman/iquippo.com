
var fs = require('fs');
var config = require('../config/environment/development');
var path = require('path');
var utility = require('../components/utility.js'); // /server/components/utility.js


console.log("Start Copy assets directory/sub-directories");
    utility.uploadDirToS3(config.templatePath ,function(err,res){
        console.log(config.templatePath);
        if(err)
            throw err;
        else {
            console.log("upload done...");
            process.exit(0);
        }
    });
/* 
 * 
 */
