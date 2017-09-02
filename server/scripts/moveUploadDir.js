'use strict';

var fs = require('fs');
var config = require('../config/environment/development');
var path = require('path');
var utility = require('../components/utility.js'); // /server/components/utility.js
var async = require('async');

/*
AA;Process of existing uploading images on s3
If we found directory other then uploads then we will upload that directy
for upload we will read upload directory
and send data in chunks
chunk size could be increased if we have more directories 
*/


function init(cb) {
	var uploadPath = config.templatePath;
	fs.readdir(uploadPath, function(err, dir) {
		if (err) {
			console.log(err);
			cb(err);
		}

		async.forEach(dir, initRead, endRead);

		function initRead(x, outerCb) {
			//Found uploads the push it in chunks
			if (x === 'uploads') {
				var newUploadPath = path.join(config.templatePath, x);
				fs.readdir(newUploadPath, function(uploadErr, data) {
					if (uploadErr) {
						outerCb(err);
					}
					async.eachLimit(data, 10, init, final);
					function init(d, innerCb) {
						var uploadDirPath = path.join(newUploadPath,d);
						console.log(uploadDirPath);
						utility.uploadFileS3(uploadDirPath, d, function(err) {
							if (err)
								return innerCb(err);
							return innerCb();
						});
					}

					function final(err) {
						if (err) {
							return outerCb(err);
						}
						return outerCb();
					}
				});
			} else {
				//else upload that directory directly
				utility.uploadDirToS3(uploadPath, function(err) {
					if (err)
						return outerCb(err);
					return outerCb();
				});
			}
		}

		function endRead(error) {
			if (error)
				return cb(error);

			return cb();
		}
	});

}

if (require.main === module) {
	(function() {
		init(function(err, res) {
			if (err) {
				console.log(err);
				return process.exit(1);
			}
			return process.exit(0);
		});
	}());
}

/* 
 * 
 */