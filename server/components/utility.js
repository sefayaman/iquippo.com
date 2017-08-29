'use strict';
var Seq = require('seq');
var  xlsx = require('xlsx');
var trim = require('trim');
var config = require('../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var debug = require('debug');
var moment = require('moment');

exports.toIST = toIST;
exports.paginatedResult = paginatedResult;
exports.getWorkbook = getWorkbook;
exports.excel_from_data = excel_from_data;
exports.validateExcelHeader = validateExcelHeader;
exports.toJSON = toJSON;

Date.prototype.addDays = function(days) {
    //this.setDate(this.getDate() + parseInt(days));
    this.setMinutes(this.getMinutes() + parseInt(days));
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

function toIST(value){
  if(!value)
    return '';

  return  moment(value).utcOffset('+0530').format('MM/DD/YYYY hh:mm a');
}

function paginatedResult(req,res,modelRef,filter,result,callback){

  var bodyData = req.method === 'GET' ? req.query : req.body ;
  var pageSize = bodyData.itemsPerPage || 50;
  var first_id = bodyData.first_id;
  var last_id = bodyData.last_id;
  var currentPage = bodyData.currentPage || 1;
  var prevPage = bodyData.prevPage || 0;
  var isNext = currentPage - prevPage >= 0?true:false;
  Seq()
  .seq(function(){
    var self = this;
    modelRef.count(filter,function(err,counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .seq(function(){

      var self = this;
      var sortFilter = {_id : -1};
      if(last_id && isNext){
        filter['_id'] = {'$lt' : last_id};
      }
      if(first_id && !isNext){
        filter['_id'] = {'$gt' : first_id};
        sortFilter['_id'] = 1;
      }

      var query = null;
      var skipNumber = currentPage - prevPage;
      if(skipNumber < 0)
        skipNumber = -1*skipNumber;

      query = modelRef.find(filter).sort(sortFilter).limit(pageSize*skipNumber);
      query.exec(function(err,items){
          if(!err && items.length > pageSize*(skipNumber - 1)){
                result.items = items.slice(pageSize*(skipNumber - 1),items.length);
          }else
            result.items = [];
          if(!isNext && result.items.length > 0)
           result.items.reverse();
           self(err);
    });

  })
  .seq(function(){
    if(callback){
      return callback(result);
    }
   return res.status(200).json(result);
  })
  .catch(function(err){
    handleError(res,err);
  })
 
}

function handleError(res, err) {
  return res.status(500).send(err);
}
function getWorkbook(){
  return new Workbook();
}

function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function validateExcelHeader(worksheet,headers){
  var headersInFile = getHeaders(worksheet);
  var ret = true;
  ret = headersInFile.length == headers.length;
  if(!ret)
    return ret;
  for(var i=0; i < headersInFile.length;i++){
    var hd = headers[i];
    if(headers.indexOf(hd) == -1){
      ret = false;
      break;
    }
  }

  return ret;
}


function getHeaders(worksheet){
  var headers = [];
  for(var z in worksheet) {
        if(z[0] === '!') continue;
        var col = z.substring(0,1);
        var row = parseInt(z.substring(1));
        var value = worksheet[z].v;
        if(row == 1) {
            headers[headers.length] = value;
        }
    }
  return headers;
}


function datenum(v, date1904) {
  if(date1904) v+=1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
 
function setType(cell){
  if(typeof cell.v === 'number')
    cell.t = 'n';
  else if(typeof cell.v === 'boolean')
      cell.t = 'b';
  else if(cell.v instanceof Date)
   {
        cell.t = 'n'; cell.z = xlsx.SSF._table[14];
        cell.v = datenum(cell.v);
    }
    else cell.t = 's';
}

function setCell(ws, cell, R, C) {
  setType(cell);
  var cell_ref = xlsx.utils.encode_cell({
    c: C,
    r: R
  })
  ws[cell_ref] = cell;
}

function excel_from_data(data,headers) {
  var ws = {};
  var range;
  range = {s: {c: 0,r: 0},e: {c: headers.length,r: data.length}};
  for (var R = 0; R < data.length ; ++R) {
    var C = 0;
    var rowItems = data[R];
    rowItems.forEach(function(item){
      if(!item && item != 0)
          item = "";
       var cell = {v :item + ""};
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

  if(!headers || !headers.length)
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
  
  if(!options.notValidateHeaders){
    var ret = validateExcelHeader(worksheet,headers);

    if(!ret)
      return new Error('Invalid Excel file');
  }
  

  var data = xlsx.utils.sheet_to_json(worksheet);
  
  var fieldMapping = options.mapping;
  if(!fieldMapping || !Object.keys(fieldMapping).length){
    return new Error('Invalid or Missing mapping');
  }

  if(!fieldMapping.__rowNum__)
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
    var formattedDate = moment(dateString,format).format(dateFormat);
    if (formattedDate === 'Invalid date') {
      formattedDate = null;
    }
    return formattedDate;
  },
  isValidDateTime: function(dateTimeString, format) {
    if(!dateTimeString)
      return function isValid(){return false;}
    return moment(dateTimeString.toString(),format);
  }
}

exports.dateUtil = dateUtil;