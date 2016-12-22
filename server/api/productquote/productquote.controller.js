'use strict';

var _ = require('lodash');
var ProductQuote = require('./productquote.model');
var email = require('./../../components/sendEmail.js');
var Utility = require('./../../components/utility.js');
var  xlsx = require('xlsx');

// Get list of quote
exports.getAll = function(req, res) {
  ProductQuote.find(function (err, quote) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(quote);
  });
};

// Get a single quote
exports.getOnId = function(req, res) {
  ProductQuote.findById(req.params.id, function (err, quote) {
    if(err) { return handleError(res, err); }
    if(!quote) { return res.status(404).send('Not Found'); }
    return res.json(quote);
  });
};

//search based on product productId
exports.getAdditionalService = function(req, res) {
  var filter = {};
  if(req.body.productId)
    filter["product.productId"] = req.body.productId;

  var query = ProductQuote.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, addServices) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(addServices);
               }
  );
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
    arr[arr.length] = { country: { $regex: searchStrReg }};
    arr[arr.length] = { city: { $regex: searchStrReg }};
    arr[arr.length] = { companyname: { $regex: searchStrReg }};
    arr[arr.length] = { designation: { $regex: searchStrReg }};
    arr[arr.length] = { "shippingQuote.allowed": { $regex: searchStrReg }};
    arr[arr.length] = { "shippingQuote.packaging": { $regex: searchStrReg }};
    arr[arr.length] = { "valuationQuote.valuation": { $regex: searchStrReg }};
    arr[arr.length] = { "valuationQuote.otherName": { $regex: searchStrReg }};
    arr[arr.length] = { "valuationQuote.schedule": { $regex: searchStrReg }};
    arr[arr.length] = { "valuationQuote.comment": { $regex: searchStrReg }};
    arr[arr.length] = { "certifiedByIQuippoQuote.valuation": { $regex: searchStrReg }};
    arr[arr.length] = { "certifiedByIQuippoQuote.otherName": { $regex: searchStrReg }};
    arr[arr.length] = { "certifiedByIQuippoQuote.scheduleC": { $regex: searchStrReg }};
    arr[arr.length] = { "certifiedByIQuippoQuote.comment": { $regex: searchStrReg }};
    arr[arr.length] = { "manpowerQuote.usedBy": { $regex: searchStrReg }};
    arr[arr.length] = { "manpowerQuote.otherName": { $regex: searchStrReg }};
    arr[arr.length] = { "manpowerQuote.equipments": { $regex: searchStrReg }};
    arr[arr.length] = { "manpowerQuote.scheduleM": { $regex: searchStrReg }};
    arr[arr.length] = { "manpowerQuote.comment": { $regex: searchStrReg }};
  }

  if(arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,ProductQuote,filter,{});
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = ProductQuote.find(filter).sort(sortObj); 
  query.exec(
      function (err, quotes) {
            if(err) { return handleError(res, err); }
            return res.status(200).json(quotes);
     }
  );
};

// Creates a new quote in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  // var prQuote = validateProductQuote(req.body);
  req.body.createdAt = new Date();
  ProductQuote.create(req.body, function(err, quote) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(quote);
  });
};

exports.exportAdditionalSvc = function(req,res){
  var filter = {};
  
  // if(req.body.filter)
  //   filter = req.body.filter;
  var query = ProductQuote.find(filter).sort({createdAt: -1});
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
  range = {s: {c:0, r:0}, e: {c:22, r:data.length }};

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
      cell = {v: "Country"};
    else {
      if(user)
        cell = {v: user.country || ""};
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
      cell = {v: "Company Name"};
    else {
      if(user)
        cell = {v: user.companyname || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Designation"};
    else {
      if(user)
        cell = {v: user.designation || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Part Shipment Allowed (Yes / No)"};
    else {
      if(user && user.shippingQuote)
        cell = {v: user.shippingQuote.allowed || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Packaging as per International Standards (Yes / No)"};
    else {
      if(user && user.shippingQuote)
        cell = {v: user.shippingQuote.packaging || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Valuation Quote - Purpose of Valutaion"};
    else {
      if(user && user.valuationQuote)
        cell = {v: user.valuationQuote.valuation || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Valuation Quote - Schedule a Call (Yes / No)"};
    else {
      if(user && user.valuationQuote)
        cell = {v: user.valuationQuote.schedule || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Valuation Quote - Comments"};
    else {
      if(user && user.valuationQuote)
        cell = {v: user.valuationQuote.comment || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Certified - Purpose of Valutaion"};
    else {
      if(user && user.certifiedByIQuippoQuote)
        cell = {v: user.certifiedByIQuippoQuote.valuation || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Certified - Schedule a Call (Yes / No)"};
    else {
      if(user && user.certifiedByIQuippoQuote)
        cell = {v: user.certifiedByIQuippoQuote.scheduleC || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Certified - Comments"};
    else {
      if(user && user.certifiedByIQuippoQuote)
        cell = {v: user.certifiedByIQuippoQuote.comment || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var usedBy = '';
    if(user && user.manpowerQuote && user.manpowerQuote.usedBy)
      usedBy = user.manpowerQuote.usedBy;
    else
      usedBy = '';
    if(R == 0)
      cell = {v: "Manpower - Operators"};
    else 
      cell  = {v: usedBy};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var equipments = '';
    if(user && user.manpowerQuote && user.manpowerQuote.equipments)
      equipments = user.manpowerQuote.equipments;
    else
      equipments = '';
    if(R == 0)
      cell = {v: "Manpower - Equipments"};
    else 
      cell  = {v: equipments};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var scheduleM = '';
    if(user && user.manpowerQuote && user.manpowerQuote.scheduleM)
      scheduleM = user.manpowerQuote.scheduleM;
    else
      scheduleM = '';
    if(R == 0)
      cell = {v: "Manpower - Schedule a Call (Yes / No)"};
    else 
      cell  = {v: scheduleM};
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    var comment = '';
    if(user && user.manpowerQuote && user.manpowerQuote.comment)
      comment = user.manpowerQuote.comment;
    else
      comment = '';
    if(R == 0)
      cell = {v: "Manpower - Comments"};
    else 
      cell  = {v: comment};
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

/*function validateProductQuote(prQuote){
  var isPastLease = prQuote.leaseQuote.isPastLeasing;
  delete prQuote.leaseQuote.isPastLeasing;
  var pastLease = prQuote.leaseQuote.pastLease;
  delete prQuote.leaseQuote.pastLease;

  var leaseVendors = prQuote.leaseQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });
  delete prQuote.leaseQuote.vendors;

  var insuranceVendors = prQuote.insuranceQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });
  delete prQuote.insuranceQuote.vendors;

  var tVendors = prQuote.transportationQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });
  
  delete prQuote.transportationQuote.vendors;
  var valVendors = prQuote.valuationQuote.vendors.filter(function(d){
    var retVal = false;
    if(d.selected)
      retVal = true;
     return retVal; 
  });

  delete prQuote.valuationQuote.vendors;

  if(_.isEmpty(prQuote.leaseQuote) && leaseVendors.length == 0){
      delete prQuote.leaseQuote;
  }else{
     prQuote.leaseQuote.vendors = leaseVendors;
     prQuote.leaseQuote.isPastLeasing = isPastLease;
     if(isPastLease == 'yes')
        prQuote.leaseQuote.pastLease = pastLease;
  }
  if(_.isEmpty(prQuote.transportationQuote) && tVendors.length == 0){
      delete prQuote.transportationQuote;
  }else{
     prQuote.transportationQuote.vendors = tVendors;
  }

  if(_.isEmpty(prQuote.insuranceQuote) && insuranceVendors.length == 0){
      delete prQuote.insuranceQuote;
  }else{
     prQuote.insuranceQuote.vendors = insuranceVendors;
    
  }

  if(_.isEmpty(prQuote.valuationQuote) && valVendors.length == 0){
      delete prQuote.valuationQuote;
  }else{
     prQuote.valuationQuote.vendors = valVendors;
    
  }

  return prQuote;
  
}*/