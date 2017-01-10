'use strict';

var _ = require('lodash');
var Callback = require('./callback.model');
var Utility = require('./../../components/utility.js');
var  xlsx = require('xlsx');

// Get list of callback
exports.getAll = function(req, res) {
  Callback.find(function (err, callback) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(callback);
  });
};

// Get a single callback
exports.getOnId = function(req, res) {
  Callback.findById(req.params.id, function (err, callback) {
    if(err) { return handleError(res, err); }
    if(!callback) { return res.status(404).send('Not Found'); }
    return res.json(callback);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  if(req.body.userMobileNos)
    filter['mobile'] = {$in:req.body.userMobileNos};
  var arr = [];
  if(req.body.searchstr){
    arr[arr.length] = { fname: { $regex: searchStrReg }};
    arr[arr.length] = { lname: { $regex: searchStrReg }};
    arr[arr.length] = { mobile: { $regex: searchStrReg }};
    arr[arr.length] = { phone: { $regex: searchStrReg }};
    arr[arr.length] = { email: { $regex: searchStrReg }};
  }

  if(arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,Callback,filter,{});
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Callback.find(filter).sort(sortObj); 
  query.exec(
      function (err, callbacks) {
          if(err) { return handleError(res, err); }
          //console.log(callbacks);
          return res.status(200).json(callbacks);
       }
  );
};

// Creates a new callback in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  Callback.create(req.body, function(err, callback) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(callback);
  });
};

exports.exportCallback = function(req,res){
  var filter = {};
  
  // if(req.body.filter)
  //   filter = req.body.filter;
  if(req.body.userMobileNos)
    filter['mobile'] = {$in: req.body.userMobileNos.split(',')};
  var query = Callback.find(filter).sort({createdAt: -1});
  query.exec(
     function (err, users) {
        if(err) { return handleError(res, err); }
        var ws_name = "users"
        var wb = new Workbook();
        var ws = excel_from_data(users);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
}

//export data into excel
function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
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

function excel_from_data(data) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:6, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    
    var C = 0;
    var user = null;
    var cell = null;
    if(R != 0)
      user = data[R-1];

    if(R == 0)
      cell = {v: "Sr. No"};
    else{
      if(user)
        cell =  {v: R};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Full Name"};
    else{
      if(user)
        cell =  {v: (user.fname || "") + " " + (user.mname || "") + " " + (user.lname || "")};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Mobile No."};
    else {
      if(user)
        cell = {v: user.mobile || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "Phone No."};
    else {
      if(user)
        cell = {v: user.phone || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Email Address"};
    else {
      if(user)
        cell = {v: user.email || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Date of Request"};
    else {
      if(user)
        cell = {v: user.createdAt};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

function handleError(res, err) {
  return res.status(500).send(err);
}