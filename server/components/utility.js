'use strict';
var Seq = require('seq');
var xlsx = require('xlsx');
var trim = require('trim');
var config = require('../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var debug = require('debug')('server.components.utility');
var async = require('async');
var moment = require('moment');
var fs = require('fs');
var AuctionMaster = require('../api/auction/auctionmaster.model');
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
var dateFormat = require('dateformat');

var multiparty = require('connect-multiparty'),
  multipartyMiddleware = multiparty();
AWS.config.update({
  accessKeyId: config.awsAccessKeyId,
  secretAccessKey: config.awsSecretAccessKey
});
AWS.config.region = 'ap-south-1';

var awsS3Client = new AWS.S3(s3Options);
var options = {
  s3Client: awsS3Client
};

var client = s3.createClient(options);
var request = require('request');

exports.toIST = toIST;
exports.convertQVAPLStatus = convertQVAPLStatus;
exports.paginatedResult = paginatedResult;
exports.getWorkbook = getWorkbook;
exports.excel_from_data = excel_from_data;
exports.validateExcelHeader = validateExcelHeader;
exports.toJSON = toJSON;
exports.uploadFileS3 = uploadFileS3;
//exports.uploadDirToS3 = uploadDirToS3;
//exports.uploadZipFileToS3 = uploadZipFileToS3;
exports.downloadFromS3 = downloadFromS3;
exports.deleteFromS3 = deleteFromS3;
exports.uploadFileOnS3 = uploadFileOnS3;
exports.getListObjectS3 = getListObjectS3;
exports.deleteS3File = deleteS3File;
exports.uploadMultipartFileOnS3 = uploadMultipartFileOnS3;

Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + parseInt(days));
  //this.setMinutes(this.getMinutes() + parseInt(days));
  return this;
};

Date.prototype.addHours = function(hours) {
  //this.setMinutes(this.getMinutes() + parseInt(hours));
  this.setHours(this.getHours() + parseInt(hours));
  return this;
};

Date.prototype.addMinutes = function(minutes) {
  this.setMinutes(this.getMinutes() + parseInt(minutes));
  return this;
};


function uploadFileS3(localFilePath, dirName, cb) {
  var params = {
    localDir: localFilePath,
    s3Params: {
      Bucket: config.awsBucket,
      Prefix: "assets/uploads/" + dirName
    }
  };

  var uploader = client.uploadDir(params);
  uploader.on('error', function(err) {
    if (err) {
      debug(err);
      return cb(err);
    }
  });

  uploader.on('end', function() {
    return cb();
  });
}

function uploadFileOnS3(localFilePath, dirName, cb) {
  var params = {
    localFile: localFilePath,
    s3Params: {
      Bucket: config.awsBucket,
      Key: dirName
    }
  };

  var uploader = client.uploadFile(params);
  uploader.on('error', function(err) {
    if (err) {
      debug(err);
      return cb(err);
    }
  });
  /*uploader.on('progress', function() {
    console.log("progress", uploader.progressMd5Amount,
      uploader.progressAmount, uploader.progressTotal);
  });*/

  uploader.on('end', function() {
    //console.log("done uploading");
    return cb();
  });
}

function uploadMultipartFileOnS3(localFilePath, dirName, files, cb) {
  if (!files[0])
    return;
  var file = files[0];
  var buffer = fs.readFileSync(file.path);
  var startTime = new Date();
  var partNum = 0;
  var partSize = 1024 * 1024 * 5; // 5mb chunks except last part
  var numPartsLeft = Math.ceil(buffer.length / partSize);
  var maxUploadTries = 3;

  var multipartParams = {
    Bucket: config.awsBucket,
    Key: dirName,
    ContentType: file.mimetype
  };

  var multipartMap = {
    Parts: []
  };

  awsS3Client.createMultipartUpload(multipartParams, function(mpErr, multipart) {
    if (mpErr) {
      console.error('Error!', mpErr);
      return cb(err);
    }
    for (var start = 0; start < buffer.length; start += partSize) {
      partNum++;
      var end = Math.min(start + partSize, buffer.length);
      var partParams = {
        Body: buffer.slice(start, end),
        Bucket: multipartParams.Bucket,
        Key: multipartParams.Key,
        PartNumber: String(partNum),
        UploadId: multipart.UploadId
      };

      uploadPart(awsS3Client, multipart, partParams);
    }
  });

  function completeMultipartUpload(awsS3Client, doneParams) {
    awsS3Client.completeMultipartUpload(doneParams, function(err, data) {
      if (err) {
        console.error('An error occurred while completing multipart upload');
        return cb(err);
      }
      var delta = (new Date() - startTime) / 1000;
      console.log('Completed upload in', delta, 'seconds');
      console.log('Final upload data:', data);
      return cb();
    });
  }

  function uploadPart(awsS3Client, multipart, partParams, tryNum) {
    var tryNum = tryNum || 1;
    awsS3Client.uploadPart(partParams, function(multiErr, mData) {
      if (multiErr) {
        console.log('Upload part error:', multiErr);

        if (tryNum < maxUploadTries) {
          console.log('Retrying upload of part: #', partParams.PartNumber);
          uploadPart(awsS3Client, multipart, partParams, tryNum + 1);
        } else {
          console.log('Failed uploading part: #', partParams.PartNumber);
        }
        // return;
      }

      multipartMap.Parts[this.request.params.PartNumber - 1] = {
        ETag: mData.ETag,
        PartNumber: Number(this.request.params.PartNumber)
      };
      if (--numPartsLeft > 0) return; // complete only when all parts uploaded

      var doneParams = {
        Bucket: multipartParams.Bucket,
        Key: multipartParams.Key,
        MultipartUpload: multipartMap,
        UploadId: multipart.UploadId
      };

      completeMultipartUpload(awsS3Client, doneParams);
    }).on('httpUploadProgress', function(progress) {
      console.log(Math.round(progress.loaded / progress.total * 100) + '% done')
    });
  }
}


function downloadFromS3(opts, cb) {
  var params = {
    localDir: opts.localDir,

    s3Params: {
      Bucket: config.awsBucket,
      Prefix: opts.prefix
    }
  };
  //var s3 = new AWS.S3();
  var downloader = client.downloadDir(params);

  downloader.on('error', function(err) {
    if (err) {
      debug(err);
      return cb(err);
    }
  });

  downloader.on('end', function() {
    return cb();
  });

}

function deleteFromS3(opts, cb) {
  var params = {
    Bucket: config.awsBucket,
    Prefix: opts.prefix
  };
  //var s3 = new AWS.S3();
  var deleter = client.deleteDir(params);

  deleter.on('error', function(err) {
    if (err) {
      debug(err);
      return cb(err);
    }
  });

  deleter.on('end', function() {
    return cb();
  });
}

function isEmpty(myObject) {
  for (var key in myObject) {
    if (myObject.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}

function toIST(value) {
  if (!value)
    return '';
  return moment(value).utcOffset('+0530');
}

exports.sendCompiledData = sendCompiledData;
function sendCompiledData(options, cb) {
  if (options.dataToSend.hasOwnProperty('__v'))
    delete options.dataToSend._v;
  if (options.dataToSend.startDate && options.dataToSend.endDate) {
    options.dataToSend.startDate = new Date(options.dataToSend.startDate);
    options.dataToSend.endDate = new Date(options.dataToSend.endDate);
  }
  
  if (options.dataToSend.regEndDate)
    options.dataToSend.regEndDate = new Date(options.dataToSend.regEndDate);

  if (options.dataToSend.insStartDate && options.dataToSend.insEndDate) {
    options.dataToSend.insStartDate = new Date(options.dataToSend.insStartDate);
    options.dataToSend.insEndDate = new Date(options.dataToSend.insEndDate);
  }
  if (options.dataToSend.hasOwnProperty('updatedAt') && options.dataToSend.hasOwnProperty('createdAt')) {
    delete options.dataToSend.updatedAt;
    delete options.dataToSend.createdAt;
  }
  async.series([function(next) {
    fetchAuctionId(options, next);
  }, function(next) {
    compileData(options, next);
  }, function(next) {
    sendData(options, next);
  }], function(err, results) {
    if (err) {
      return cb(err)
    }
    var aucResult = {};
    results.forEach(function(item){
      if(item.err)
        aucResult.err = item.err;
      if(item.results)
        aucResult.result = item.results;
    });
    //console.log("Output result#aucResult.result#", aucResult);
    return cb(null, aucResult);
  });
}

function fetchAuctionId(options, callback) {
  if (options.dataToSend && options.dataToSend.auction_id && options.dataType !== 'auctionData') {
    AuctionMaster.find({
      "_id": options.dataToSend.auction_id
    }, function(err, auctionData) {
      if (err) return callback(err);
      options.dataToSend.auctionId = auctionData[0].auctionId;
      return callback(null, options);
    });
  } else {
    return callback(null, options);
  }
}

function compileData(options, callback) {
  switch (options.dataType) {
    case "userInfo":
      callback(null, options);
      break;
    case "lotData":
      if (options.dataToSend.hasOwnProperty('assetDir'))
        delete options.dataToSend.assetDir;
      callback(null, options);
      break;
    case "emdData":
      callback(null, options);
      break;
    case "auctionData":
      if(options.dataToSend.primaryImg)
        options.dataToSend.primaryImg = config.awsUrl + config.awsBucket + "/assets/uploads/auctionmaster/" + options.dataToSend.primaryImg;

      if (options.dataToSend.hasOwnProperty('staticIncrement'))
        delete options.dataToSend.staticIncrement;
      if (options.dataToSend.hasOwnProperty('rangeIncrement'))
        delete options.dataToSend.rangeIncrement;
      if (options.dataToSend.hasOwnProperty('bidInfo'))
        delete options.dataToSend.bidInfo;
      if (options.dataToSend.hasOwnProperty('auctionOwner') && options.dataToSend.hasOwnProperty('auctionOwnerMobile')) {
        delete options.dataToSend.auctionOwner;
        delete options.dataToSend.auctionOwnerMobile;
      }
      callback(null, options);
      break;
    case "assetData":
      callback(null, options);
      break;
  }
}


function sendData(options, callback) {
  if(options.dataType === 'auctionData' || options.dataType === 'lotData') {
    var serviceData = [];
    serviceData.push(options.dataToSend);
    serviceData = JSON.stringify(serviceData);
  } else {
    var serviceData = JSON.stringify(options.dataToSend);
  }
  var dataFormat = {
    "userInfo": "users",
    "lotData": "lots",
    "auctionData": "auctions",
    "emdData": "emd",
    "assetData": "assets"
  };
  var format = "";
  format = dataFormat[options.dataType];

  var data = {};
  data[format] = serviceData;
  console.log("serviceDatas", data);

  var obj = {
    "userInfo": 'registered-user-update',
    "lotData": 'new-lots',
    "auctionData": 'new-auction',
    "emdData": 'emddata',
    "assetData": 'assetdata'
  };

  var headers = {
    'User-Agent': 'Super Agent/0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  var url = config.auctionURL + obj[options.dataType];
  console.log("URL###", url);
  request.post({
    url: url,
    headers:headers,
    rejectUnauthorized:false,
    form: data
  }, function(err, httpres, asData) {
    if (err) {
      console.log("+++++++",err);
      return callback(err);
    } else {
      try {
        console.log("=======++__________",asData);
        var res = {};
        var asData = JSON.parse(asData);
        if(asData.err.length > 0)
          res.err = asData.err;
        else
          asData.err = "";

        if(asData.results.length > 0)
          res.results = asData.results;
        else
          res.results = "";

        return callback(null, res);
      } catch (err) {
        //return callback(err);
      }
    }
  });
}


function getListObjectS3(localDirPath, cb) {
  var params = {
    Bucket: config.awsBucket,
    Prefix: "downloads/user-export"
      //MaxKeys: 2
  };
  awsS3Client.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      data.Contents.forEach(function(entry) {
        //console.log("entry key",entry.Key);
        var d = new Date(entry.LastModified);
        var fileTimeStamp = d.getTime();
        var currentTimeStamp = new Date().getTime();
        var diffDays = Math.round(Math.abs((currentTimeStamp - fileTimeStamp) / (oneDay)));
        if (diffDays > 1) {
          deleteS3File(entry.Key);
        }
      });

    }
  });
}

// delete s3 file
function deleteS3File(fileName) {
  var params = {
    Bucket: config.awsBucket,
    Key: fileName
  };
  awsS3Client.deleteObject(params, function(err, data) {
    if (data) {
      //console.log("File deleted successfully");
    } else {
      console.log("Check if you have sufficient permissions : " + err);
    }
  });
}


function convertQVAPLStatus(qvaplStatus) {

  var statusMapping = {
    created: "Request Submitted",
    assign: "Request Submitted",
    accept: "Inspection In Progress",
    complete: "Inspection Completed",
    updated: "Valuation Report Submitted",
    cancel: 'Cancelled'
  }
  return statusMapping[qvaplStatus];
}

function toIST(value) {
  if (!value)
    return '';

  return moment(value).utcOffset('+0530').format('MM/DD/YYYY hh:mm a');
}

function paginatedResult(req, res, modelRef, filter, result, callback) {

  var bodyData = req.method === 'GET' ? req.query : req.body;
  var pageSize = bodyData.itemsPerPage || 50;
  var first_id = bodyData.first_id;
  var last_id = bodyData.last_id;
  var currentPage = bodyData.currentPage || 1;
  var prevPage = bodyData.prevPage || 0;
  var isNext = currentPage - prevPage >= 0 ? true : false;
  Seq()
    .seq(function() {
      var self = this;
      modelRef.count(filter, function(err, counts) {
        result.totalItems = counts;
        self(err);
      })
    })
    .seq(function() {

      var self = this;
      var sortFilter = {
        _id: -1
      };
      if (last_id && isNext) {
        filter['_id'] = {
          '$lt': last_id
        };
      }
      if (first_id && !isNext) {
        filter['_id'] = {
          '$gt': first_id
        };
        sortFilter['_id'] = 1;
      }

      var query = null;
      var skipNumber = currentPage - prevPage;
      if (skipNumber < 0)
        skipNumber = -1 * skipNumber;

      query = modelRef.find(filter).sort(sortFilter).limit(pageSize * skipNumber);
      query.exec(function(err, items) {
        if (!err && items.length > pageSize * (skipNumber - 1)) {
          result.items = items.slice(pageSize * (skipNumber - 1), items.length);
        } else
          result.items = [];
        if (!isNext && result.items.length > 0)
          result.items.reverse();
        self(err);
      });

    })
    .seq(function() {
      if (callback) {
        return callback(result);
      }
      return res.status(200).json(result);
    })
    .catch(function(err) {
      handleError(res, err);
    })

}

function handleError(res, err) {
  return res.status(500).send(err);
}

function getWorkbook() {
  return new Workbook();
}

function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function validateExcelHeader(worksheet, headers) {
  var headersInFile = getHeaders(worksheet);
  var ret = true;
  ret = headersInFile.length == headers.length;
  if (!ret)
    return ret;
  for (var i = 0; i < headersInFile.length; i++) {
    var hd = headers[i];
    if (headers.indexOf(hd) == -1) {
      ret = false;
      break;
    }
  }

  return ret;
}


function getHeaders(worksheet) {
  var headers = [];
  for (var z in worksheet) {
    if (z[0] === '!') continue;
    var col = z.substring(0, 1);
    var row = parseInt(z.substring(1));
    var value = worksheet[z].v;
    if (row == 1) {
      headers[headers.length] = value;
    }
  }
  return headers;
}


function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function setType(cell) {
  if (typeof cell.v === 'number')
    cell.t = 'n';
  else if (typeof cell.v === 'boolean')
    cell.t = 'b';
  else if (cell.v instanceof Date) {
    cell.t = 'n';
    cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  } else cell.t = 's';
}

function setCell(ws, cell, R, C) {
  setType(cell);
  var cell_ref = xlsx.utils.encode_cell({
    c: C,
    r: R
  })
  ws[cell_ref] = cell;
}

function excel_from_data(data, headers) {
  var ws = {};
  var range;
  range = {
    s: {
      c: 0,
      r: 0
    },
    e: {
      c: headers.length,
      r: data.length
    }
  };
  for (var R = 0; R < data.length; ++R) {
    var C = 0;
    var rowItems = data[R];
    rowItems.forEach(function(item) {
      if (!item && item != 0)
        item = "";
      var cell = {
        v: item + ""
      };
      setCell(ws, cell, R, C++);
    })

  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}



/*
AA:

*/
function toJSON(options) {
  var file = options.file;
  var headers = options.headers;

  if (!headers || !headers.length)
    return new Error('Invalid or Missing headers');

  if (!file)
    return new Error('Invalid or Missing file');

  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + file);
  } catch (e) {
    debug(e);
    return new Error('Error while generating worksheet');
  }

  if (!workbook)
    return new Error('No workbook found');

  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!options.notValidateHeaders) {
    var ret = validateExcelHeader(worksheet, headers);

    if (!ret)
      return new Error('Invalid Excel file');
  }


  var data = xlsx.utils.sheet_to_json(worksheet);

  var fieldMapping = options.mapping;
  if (!fieldMapping || !Object.keys(fieldMapping).length) {
    return new Error('Invalid or Missing mapping');
  }

  if (!fieldMapping.__rowNum__)
    fieldMapping.__rowNum__ = 'rowCount';

  data = data.filter(function(x) {
    Object.keys(x).forEach(function(key) {
      if (fieldMapping[key]) {
        x[fieldMapping[key]] = trim(x[key] || "");
      }
      delete x[key];
    })
    x.rowCount = x.__rowNum__;
    return x;
  });
  return data;

}

var dateUtil = {
  validateAndFormatDate: function(dateString, format) {
    var dateFormat = format || 'YYYY-MM-DD HH:mm:ss';
    var formattedDate = moment(dateString, format).format(dateFormat);
    if (formattedDate === 'Invalid date') {
      formattedDate = null;
    }
    return formattedDate;
  },
  isValidDateTime: function(dateTimeString, format) {
    if (!dateTimeString)
      return function isValid() {
        return false;
      }
    return moment(dateTimeString.toString(), format);
  }
}

exports.dateUtil = dateUtil;