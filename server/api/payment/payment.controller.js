'use strict';

var _ = require('lodash');
var Payment = require('./payment.model');
var  xlsx = require('xlsx');

// Get list of payment transaction
exports.getAll = function(req, res) {
  Payment.find(function (err, payments) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(payments);
  });
};

// Get a single Payment
exports.getOnId = function(req, res) {
  Payment.findById(req.params.id, function (err, payment) {
    if(err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
    return res.json(payment);
  });
};

// Creates a new payment in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Payement.create(req.body, function(err, payment) {
        return res.status(201).json(payment);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;

  if(req.body.userId)
    filter["user._id"] = req.body.userId;

  var query = Payment.find(filter);
  query.exec(
               function (err, payments) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(payments);
               }
  );
};
// Updates an existing payment in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Payment.findById(req.params.id, function (err, payment) {
    if (err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
     Payment.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Deletes a payment from the DB.
exports.destroy = function(req, res) {

  Payment.findById(req.params.id, function (err, payment) {
    if(err) { return handleError(res, err); }
    if(!payment) { return res.status(404).send('Not Found'); }
    Payment.remove(function(err) {
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
  range = {s: {c:0, r:0}, e: {c:9, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    var C = 0;
    var payment = null;
    if(R != 0)
      payment = data[R-1];
    var cell = null;
    if(R == 0)
      cell = {v: "Transaction Id"};
    else{
      if(payment)
        cell =  {v: payment.requestId};
    }

    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Category"};
    else{
      if(payment)
        cell =  {v: payment.product.category};
    }
    setCell(ws,cell,R,C++);


    if(R == 0)
      cell = {v: "Asset Id"};
    else{
      if(payment)
        cell =  {v: payment.product.assetId};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Asset Name"};
    else{
      if(payment)
        cell =  {v: payment.product.name};
    }
    setCell(ws,cell,R,C++);

     if(R == 0)
      cell = {v: "Asset Status"};
    else{
      if(payment)
        cell =  {v: payment.product.status};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Asset Location"};
    else{
      if(payment)
        cell =  {v: payment.product.city};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Request Type"};
    else{
      if(payment)
        cell =  {v: payment.requestType};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Request Date"};
    else{
      if(payment)
        cell =  {v: payment.createdAt};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Request Status"};
    else{
      if(payment)
        cell =  {v: payment.purpose};
    }
    setCell(ws,cell,R,C++);
    
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

exports.exportPayment = function(req,res){
  var filter = {};
  var isAdmin = true;
  if(req.body.userid){
    filter["user._id"] = req.body.userid;
    isAdmin = false;
  }
  if(req.body.ids)
    filter['_id'] = {$in:req.body.ids};
  var query = Payment.find(filter).sort({transactionId:1});
  query.exec(
     function (err, payments) {
        if(err) { return handleError(res, err); }
        var ws_name = "Payment"
        var wb = new Workbook();
        var ws = excel_from_data(payments,isAdmin);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
}


function handleError(res, err) {
  return res.status(500).send(err);
}
