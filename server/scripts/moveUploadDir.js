'use strict';

var fs = require('fs');
process.env.NODE_ENV = 'production';
var config = require('../config/environment');
var path = require('path');
//var utility = require('../components/utility.js'); // /server/components/utility.js
var async = require('async');
var _ = require('lodash');
var rimraf = require('rimraf');
var count = 0;
var util = require('util');
var AWS = require('aws-sdk');
var util = require('util');
var bucket = config.awsBucket;
var s3baseUrl = config.awsUrl;
var s3 = require('s3');
var s3Options = {
	accessKeyId: config.awsAccessKeyId,
	secretAccessKey: config.awsSecretAccessKey,
	endpoint: config.awsEndpoint,
	sslEnabled: true
};

var awsS3Client = new AWS.S3(s3Options);

/*
AA;Process of existing uploading images on s3
If we found directory other then uploads then we will upload that directy
for upload we will read upload directory
and send data in chunks
chunk size could be increased if we have more directories 
*/


function init(cb) {
	try {
		var uploadPath = '/var/lib/jenkins/iquippo.com/client/assets';
		//var uploadPath = path.resolve('../../' + config.templatePath);
		//var uploadPath =  config.templatePath;
		util.log(uploadPath);
		fs.readdir(uploadPath, function(err, dir) {
			if (err) {
				util.log(err);
				throw err;
			}

			async.forEach(dir, initRead, endRead);

			function initRead(x, outerCb) {
				//Found uploads the push it in chunks
				if (x === 'uploads') {
					var newUploadPath = path.join(uploadPath, x);

					fs.readdir(newUploadPath, function(uploadErr, data) {
						if (uploadErr) {
							return outerCb(uploadErr);
						}

						var chunkedArray = _.chunk(data, 100);
						var chunkId = 0;
						async.eachSeries(chunkedArray, startUpload, endUpload);

						function startUpload(cA, endCb) {
							chunkId++;
							util.log('Running Chunk ID# %d', chunkId);
							setTimeout(function() {
								if (cA && cA.length) {
									cA.forEach(function(d, index) {
										var uploadDirPath = path.join(newUploadPath, d);

										fs.readdir(uploadDirPath, (err, files) => {

											if (!files || files.length === 0) {
												console.log(`provided folder '${uploadDirPath}' is empty or does not exist.`);
												console.log('Make sure your project was compiled!');
												return;
											}

											// for each file in the directory
											for (const fileName of files) {

												// get the full path of the file
												const filePath = path.join(uploadDirPath, fileName);

												// ignore if directory
												if (fs.lstatSync(filePath).isDirectory()) {
													continue;
												}

												// read file contents
												fs.readFile(filePath, (error, fileContent) => {
													// if unable to read file contents, throw exception
													if (error) {
														throw error;
													}

													// upload file to S3
													awsS3Client.putObject({
														Bucket: bucket,
														Key: 'assets/uploads/' + d + '/' + fileName,
														Body: fileContent
													}, (res) => {
														console.log(`Successfully uploaded '${fileName}'!`);
														util.log('Uploaded directory # %d for chunkId # %d with path %s ', index, chunkId, filePath);

														fs.unlink(filePath, function(err, data) {
															util.log(err || 'Deleted File');
														});
													});
												});
											}
										});

									});
									return endCb();
								}
							}, 60000);
						}

						function endUpload(err) {
							if (err)
								return outerCb(err);
							util.log('Calling Outer Cb');
							return outerCb();
						}
					});
				}
			}

			function endRead(error) {
				if (error)
					throw error;
				//return cb(error);
				util.log('Calling Final Outer Func');
				return cb();
			}
		});
	} catch (e) {
		count++;
		if (count < 300) {
			setTimeout(init(cb), 120000);
		} else {
			process.exit(1);
		}
	}
}

if (require.main === module) {
	(function() {
		init(function(err, res) {
			if (err) {
				util.log(err);
				return process.exit(1);
			}
			return process.exit(0);
		});
	}());
}

/* 
 * 
 */