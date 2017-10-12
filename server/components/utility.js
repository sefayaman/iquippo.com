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
exports.uploadDirToS3 = uploadDirToS3;
exports.uploadZipFileToS3 = uploadZipFileToS3;
exports.downloadFromS3 = downloadFromS3;
exports.deleteFromS3 = deleteFromS3;
exports.uploadFileOnS3 = uploadFileOnS3;



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
//AA:Upload a directory to S3
function uploadZipFileToS3(localDirPath, filename, cb) {
  fs.readFile(localDirPath, function(err, data) {
    if (err) {
      console.log(err);
      return cb(err);
    }
    //var base64data = new Buffer(data, 'binary').toString('base64');

    var s3Params = {
      Bucket: config.awsBucket,
      Key: 'assets/uploads/temp/' + filename,
      ContentType: 'application/zip',
      Body: data
    };

    awsS3Client.putObject(s3Params, function(perr, presp) {
      if (perr) {
        return cb(perr)
      }
      return cb();
    });
  });
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

exports.sendCompiledData = sendCompiledData;


function sendCompiledData(options, cb) {
  //var dataFormat = "";
  console.log("totalData", options);
  //filter._id = emdDataAs.auctionId
  console.log(options.dataToSend, options.dataType)
  async.series([function(next) {
    fetchAuctionId(options, next);
  }, function(next) {
    compileData(options, next);
  }, function(next) {
    sendData(options, next);
  }], function(err, results) {
    if (err) {
      console.log(err);
      console.log(results);
      return cb(null, results);
    }
  });
}


function compileData(options, callback) {
  console.log("options compile", options);
  switch (options.dataType) {
    case "userInfo":
      //dataFormat = "users";
      callback(null, options);
      break;
    case "lotData":
      // dataFormat = "lots";
      if (options.dataToSend.assetDir)
        delete options.dataToSend.assetDir;
      if (!options.dataToSend.emdAmount)
        options.dataToSend.emdAmount = "";
       callback(null, options);
      break;
    case "emdData":
      //dataFormat = "emd";
      callback(null, options);
      break;
    case "auctionsData":
      // dataFormat = "auctions";
      if (options.dataToSend._id)
        delete options.dataToSend._id;
      if (options.dataToSend.auctionOwner && options.dataToSend.auctionOwnerMobile) {
        delete options.dataToSend.auctionOwner;
        delete options.dataToSend.auctionOwnerMobile;
      }
      if (options.dataToSend.bidInfo)
        delete options.dataToSend.bidInfo;
      callback(null, options);
      break;
  }
}


function fetchAuctionId(options, callback) {
  var filter = {};
  console.log("auctions", options);
  if (options.dataToSend.auctionId)
    filter._id = options.dataToSend.auctionId;
  if (options.dataToSend.startDate && options.dataToSend.endDate) {
    options.dataToSend.startDate = options.dataToSend.startDate.toString();
    options.dataToSend.endDate = options.dataToSend.endDate.toString();
  }
  if (options.dataToSend.updatedAt)
    delete options.dataToSend.updatedAt;
  AuctionMaster.find(filter, function(err, result) {
    if (err) {
      return callback(err);
    }
    if (result.length > 0) {
      options.dataToSend.auctionId = result[0].auctionId;
      console.log("optionsData", options.dataToSend);
      return callback(null, options.dataToSend);
    } else {
      return callback(err);
    }
  });
}


function sendData(options, callback) {
  var serviceData = [];
  serviceData.push(options.dataToSend);
  serviceData = JSON.stringify(serviceData);
  var dataFormat = {
    "userInfo": "users",
    "lotData": "lots",
    "auctionData": "auctions",
    "emdData": "emd"
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
  };

  var url = 'http://auctionsoftwaremarketplace.com:3007/api_call/' + obj[options.dataType];
  request.post({
    url: url,
    form: data
  }, function(err, httpres, asData) {
    if (err) {
      callback(err);
    } else {
      try {
        console.log(asData);
        callback(null, {
          message: "data updated successfully"
        });
      } catch (err) {
        callback(err);
      }
    }
  });
}


function uploadDirToS3(localDirPath, cb) {
  var params = {
    localDir: localDirPath,
    s3Params: {
      Bucket: config.awsBucket,
      Prefix: "assets/"

    }
  };

  var uploader = client.uploadDir(params);
  uploader.on('error', function(err) {
    if (err) {
      util.log(err);
      cb(new Error('Unable to upload file'));
    }
  });
  uploader.on('end', function() {
    return cb();
  });
}

function convertQVAPLStatus(qvaplStatus){
  
  var statusMapping = {
    created : "Request Submitted",
    assign :  "Request Submitted",
    accept: "Inspection In Progress",
    complete : "Inspection Completed",
    updated : "Valuation Report Submitted",
    cancel : 'Cancelled'
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