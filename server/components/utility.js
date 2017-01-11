'use strict';
var Seq = require('seq');
var  xlsx = require('xlsx');

exports.paginatedResult = paginatedResult;
exports.getWorkbook = getWorkbook;
exports.excel_from_data = excel_from_data;
exports.validateExcelHeader = validateExcelHeader;

function paginatedResult(req,res,modelRef,filter,result){

  var pageSize = req.body.itemsPerPage;
  var first_id = req.body.first_id;
  var last_id = req.body.last_id;
  var currentPage = req.body.currentPage;
  var prevPage = req.body.prevPage;
  var isNext = currentPage - prevPage >= 0?true:false;
  Seq()
  .par(function(){
    var self = this;
    modelRef.count(filter,function(err,counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){

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
      //console.log("1111111111filter",filter);
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
      return res.status(200).json(result);
  })
  .catch(function(err){
    console.log("######",err);
    handleError(res,err);
  })
 
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
       var cell = {v :item};
      setCell(ws, cell, R, C++);
    })
   
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}