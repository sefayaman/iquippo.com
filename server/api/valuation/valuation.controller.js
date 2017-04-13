'use strict';

var _ = require('lodash');
var ValuationReq = require('./valuation.model');
var PaymentTransaction = require('./../payment/payment.model');
var Seq = require('seq');
var  xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');

// Get list of Valuation
exports.getAll = function(req, res) {
  ValuationReq.find(function (err, valuations) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(valuations);
  });
};

// Get a single valuation
exports.getOnId = function(req, res) {
  ValuationReq.findById(req.params.id, function (err, valuation) {
    if(err) { return handleError(res, err); }
    if(!valuation) { return res.status(404).send('Not Found'); }
    return res.json(valuation);
  });
};

// Creates a new valuation in the DB.
exports.create = function(req, res) {

  if(!req.body.valuation.user){
    return handleError(res,new Error("No User found in request"));
  }

  Seq()
  .seq(function(){
    var self = this;
    if(!req.body.payment){
      self()
      return;
    }
    req.body.payment.createdAt = new Date();
    req.body.payment.updatedAt = new Date();
     PaymentTransaction.create(req.body.payment, function(err, payment) {
        if(err){return handleError(err,res)}
          else{
            req.transactionId = payment._id;
            self();
          }
        });
    })
    .seq(function(){
      var self = this;
      req.body.valuation.createdAt = new Date();
      req.body.valuation.updatedAt = new Date();
      req.body.valuation.transactionId = req.transactionId;
      ValuationReq.create(req.body.valuation, function(err, valuation) {
        if(err){return handleError(err,res)}
          else{
            var resObj = {}
            resObj.transactionId = valuation.transactionId;
            return res.status(200).json(resObj);
          }
        });
    })
};

//search based on filter
exports.getOnFilter = function(req, res) {

  var filter = {};
  var orFilter = [];
  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in:req.body.userMobileNos};

  if(req.body.searchstr){
     var term = new RegExp(req.body.searchstr, 'i');
     orFilter[orFilter.length] = { "user.fname": { $regex: term }};
     orFilter[orFilter.length] = { "user.lname": { $regex: term }};
     orFilter[orFilter.length] = { "user.mobile": { $regex: term }};
     orFilter[orFilter.length] = { "user.phone": { $regex: term }};
     orFilter[orFilter.length] = { "user.email": { $regex: term }};
     orFilter[orFilter.length] = { "user.country": { $regex: term }};
     orFilter[orFilter.length] = {"product.name":{$regex:term}};
     orFilter[orFilter.length] = {"product.category":{$regex:term}};
     orFilter[orFilter.length] = {"product.status":{$regex:term}};
     orFilter[orFilter.length] = {"product.mfgYear":{$regex:term}};
     orFilter[orFilter.length] = {"valuationAgency.name":{$regex:term}};
     orFilter[orFilter.length] = {requestId:{$regex:term}};
     orFilter[orFilter.length] = {status:{$regex:term}};
     orFilter[orFilter.length] = {purpose:{$regex:term}};
  }

  if(orFilter.length > 0){
    filter['$or'] = orFilter;
  }

  if(req.body.userId){
    filter['user._id'] = req.body.userId;
  }
  if(req.body.sellerId){
    filter['seller._id'] = req.body.sellerId;
    filter['user._id'] = {$ne:req.body.sellerId};
  }

  if(req.body.statuses)
       filter['status'] = {$in:req.body.statuses};

    if(req.body.partnerId)
       filter['valuationAgency._id'] = req.body.partnerId;

  if(req.body.tid)
       filter['transactionId'] = req.body.tid;
  if(req.body.pagination){
    Utility.paginatedResult(req,res,ValuationReq,filter,{});
    return;
  }

  var query = ValuationReq.find(filter);
  query.exec(
               function (err, valuations) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(valuations);
               }
  );
};


// Updates an existing valuation in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  ValuationReq.findById(req.params.id, function (err, valuation) {
    if (err) { return handleError(res, err); }
    if(!valuation) { return res.status(404).send('Not Found'); }
     ValuationReq.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Deletes a valuation from the DB.
exports.destroy = function(req, res) {
  ValuationReq.findById(req.params.id, function (err, valuation) {
    if(err) { return handleError(res, err); }
    if(!valuation) { return res.status(404).send('Not Found'); }
    valuation.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

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

function setCell(ws,cell,R,C){
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C,r:R}) 
    ws[cell_ref] = cell;
}

function excel_from_data(data, isAdmin) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:18, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    var C = 0;
    var valuation = null;
    if(R != 0)
      valuation = data[R-1];
    var cell = null;

    if(R == 0)
      cell = {v: "Full Name"};
    else{
      if(valuation)
        cell =  {v: (valuation.user && valuation.user.fname || "") + " " + (valuation.user && valuation.user.lname || "")};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Country"};
    else{
      if(valuation)
        cell =  {v: valuation.user && valuation.user.country || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Location"};
    else{
      if(valuation)
        cell =  {v: valuation.user && valuation.user.city || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Phone No."};
    else{
      if(valuation)
        cell =  {v: valuation.user && valuation.user.phone || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Mobile No."};
    else{
      if(valuation)
        cell =  {v: valuation.user && valuation.user.mobile || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Email Address"};
    else{
      if(valuation)
        cell =  {v: valuation.user && valuation.user.email || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Valuation Request Id"};
    else{
      if(valuation)
        cell =  {v: valuation.requestId};
    }

    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Category"};
    else{
      if(valuation)
        cell =  {v: valuation.product.category};
    }
    setCell(ws,cell,R,C++);


    if(R == 0)
      cell = {v: "Asset Id"};
    else{
      if(valuation)
        cell =  {v: valuation.product.assetId};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Asset Name"};
    else{
      if(valuation)
        cell =  {v: valuation.product.name};
    }
    setCell(ws,cell,R,C++);

     if(R == 0)
      cell = {v: "Asset Status"};
    else{
      if(valuation)
        cell =  {v: valuation.product.status};
    }
    setCell(ws,cell,R,C++);

    /*if(R == 0)
      cell = {v: "Model"};
    else{
      if(valuation)
        cell =  {v: valuation.product.model};
    }
    setCell(ws,cell,R,C++);*/

    if(R == 0)
      cell = {v: "Manufaturing Year"};
    else{
      if(valuation)
        cell =  {v: valuation.product.mfgYear};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Asset Location"};
    else{
      if(valuation)
        cell =  {v: valuation.product.city};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Machine Serial No."};
    else{
      if(valuation)
        cell =  {v: valuation.product.serialNumber || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Agency Name"};
    else{
      if(valuation)
        cell =  {v: valuation.valuationAgency.name};
    }

    setCell(ws,cell,R,C++);
    if(R == 0)
      cell = {v: "Request Date"};
    else{
      if(valuation)
        cell =  {v: Utility.toIST(_.get(valuation, 'createdAt', ''))};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Request Purpose"};
    else{
      if(valuation)
        cell =  {v: valuation.purpose};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Request Status"};
    else{
      if(valuation)
        cell =  {v: valuation.status};
    }
    setCell(ws,cell,R,C++);
    
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

exports.exportValuation = function(req,res){
  var filter = {};
  var isAdmin = true;
  if(req.body.userid){
    filter["user._id"] = req.body.userid;
    isAdmin = false;
  }
  if(req.body.ids)
    filter['_id'] = {$in:req.body.ids};

  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in: req.body.userMobileNos.split(',')};

  var query = ValuationReq.find(filter).sort({auctionId:1});
  query.exec(
     function (err, valuatios) {
        if(err) { return handleError(res, err); }
        var ws_name = "valuation"
        var wb = new Workbook();
        var ws = excel_from_data(valuatios,isAdmin);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
}

function handleError(res, err) {
  return res.status(500).send(err);
}
