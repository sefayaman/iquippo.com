'use strict';

var _ = require('lodash');
var Quote = require('./quote.model');
var Product = require('./../product/product.model');
var commonController = require('./../common/common.controller');
var notification = require('./../../components/notification.js');
var config = require('./../../config/environment');
var FEEDBACK_TEMPLATE_NAME = "productEnquiriesRequestForQuoteFeedbackToCustomer";
var Utility = require('./../../components/utility.js');
var  xlsx = require('xlsx');

// Get list of quote
exports.getAll = function(req, res) {
  Quote.find(function (err, quote) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(quote);
  });
};

// Get a single quote
exports.getOnId = function(req, res) {
  Quote.findById(req.params.id, function (err, quote) {
    if(err) { return handleError(res, err); }
    if(!quote) { return res.status(404).send('Not Found'); }
    return res.json(quote);
  });
};

////////
// Creates a new quote in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  Quote.create(req.body, function(err, quote) {
    if(err) { return handleError(res, err); }
    if(req.body.category && req.body.brand && req.body.model)
      findBestMatch(req,res);
    else
      return res.status(201).json(quote);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  var arr = [];
  if(req.body.searchstr){
    arr[arr.length] = {fname: { $regex: searchStrReg }};
    arr[arr.length] = { lname: { $regex: searchStrReg }};
    arr[arr.length] = { mobile: { $regex: searchStrReg }};
    arr[arr.length] = { phone: { $regex: searchStrReg }};
    arr[arr.length] = { email: { $regex: searchStrReg }};
    arr[arr.length] = { category: { $regex: searchStrReg }};
    arr[arr.length] = { brand: { $regex: searchStrReg }};
    arr[arr.length] = { model: { $regex: searchStrReg }};
    arr[arr.length] = { city: { $regex: searchStrReg }};
    arr[arr.length] = { comment: { $regex: searchStrReg }};
    arr[arr.length] = { expPrice: { $regex: searchStrReg }}; 
  }

  if(arr.length > 0)
    filter['$or'] = arr;

  if(req.body.userMobileNos)
    filter['mobile'] = {$in:req.body.userMobileNos};
  
  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,Quote,filter,{});
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = Quote.find(filter).sort(sortObj); 
  query.exec(
      function (err, quotes) {
            if(err) { return handleError(res, err); }
            return res.status(200).json(quotes);
     }
  );
};

function findBestMatch(req,res){
  var catTerm = new RegExp("^" + req.body.category + "$", 'i');
  var brTerm = new RegExp("^" + req.body.brand + "$", 'i');
  var mdTerm = new RegExp("^" + req.body.model + "$", 'i');
  Product.find({'category.name':catTerm,'brand.name':brTerm,'model.name':mdTerm},function(err,prds){
    if(err){return handleError(res, err);}
    if(prds && prds.length > 0){
      pushNotification(req,res,prds[0]);
    }else
      return res.status(201).json({});
  });

}

function pushNotification(req,res,product){
   try{
        if(!req.body.email)
          return res.status(401).send('email not found');
        var emailData = {};
        emailData.to = req.body.email;
        var tmplName = FEEDBACK_TEMPLATE_NAME;
        emailData.notificationType = "email";
        emailData.subject = "Product Exist Now";
        var tplData = {};
        tplData.date = new Date();
        tplData.contactNumber = config.contactNumber;
        tplData.best = product;
        commonController.compileTemplate(tplData, config.serverPath, tmplName, function(ret,retData){
          if(!ret){
              res.status(500).send("");
          }else{
              emailData.content =  retData;
              notification.pushNotification(emailData,function(pushed){
                return res.status(201).json({});
              });
          }
        });
    }
    catch (ex) {
      return handleError(res,ex);
    }
}

exports.exportQuickQuery = function(req,res){
  var filter = {};
  
  // if(req.body.filter)
  //   filter = req.body.filter;
  if(req.body.userMobileNos)
    filter['mobile'] = {$in:req.body.userMobileNos.split(',')};
  var query = Quote.find(filter).sort({createdAt: -1});
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
  range = {s: {c:0, r:0}, e: {c:12, r:data.length }};

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

    if(R == 0)
      cell = {v: "Category"};
    else {
      if(user)
        cell = {v: user.category || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Brand"};
    else {
      if(user)
        cell = {v: user.brand || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Model"};
    else {
      if(user)
        cell = {v: user.model || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Expected Price"};
    else {
      if(user)
        cell = {v: user.expPrice || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "City"};
    else {
      if(user)
        cell = {v: user.city || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Comment"};
    else {
      if(user)
        cell = {v: user.comment || ""};
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