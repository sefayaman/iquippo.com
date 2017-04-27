'use strict';

var _ = require('lodash');
var crypto = require('crypto');
var Payment = require('./payment.model');
var  xlsx = require('xlsx');

var trasactionStatuses = ['failed','pending','completed'];

// Get list of payment transaction
exports.getAll = function(req, res) {

  Payment.find({status:{$eq:'listed'}},function (err, payments) {
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
  console.log("filters",filter);

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
        cell =  {v: payment.status};
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

//ccavenue payment keys
var ccAvenueWorkingKey = "BCCD36E2D20659D5F76B99973880340D"; // localhost account test
//var ccAvenueWorkingKey = "780039A27217D66E066A031F52D772D7"; // localhost live account account
//var ccAvenueWorkingKey = "4B309EB35A3F3C9F903427AB11E062EE"; // iquippo.com live account account

exports.encrypt = function(req,res){
    var m = crypto.createHash('md5');
    m.update(ccAvenueWorkingKey);
    var key = m.digest('binary');
    var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    var encoded = cipher.update(req.body.rawstr, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return res.status(200).json(encoded);
}

exports.paymentResponse = function(req,res){
    var json = {};
    if (req.body != undefined && Object.keys(req.body).length > 0) {
        json = req.body;
    }
    else if (req.params != undefined && Object.keys(req.params).length > 0) {
        json = req.params;
    }
    else if (req.query != undefined && Object.keys(req.query).length > 0) {
        json = request.query;
    }

    //console.log("#########",json);

    var m = crypto.createHash('md5');
    m.update(ccAvenueWorkingKey)
    var key = m.digest('binary');
    var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var decoded = decipher.update(json.encResp, 'hex', 'utf8');
    decoded += decipher.final('utf8');

    var arrayVAl = decoded.split("&");
    var resPayment = {};

    arrayVAl.forEach(function (d) {
        var val = d.split("=");
        resPayment[val[0]] = val[1];
    });

    var status = resPayment.order_status.toString().toLowerCase().trim();
    Payment.findById(resPayment.order_id, function (err, payment) {
      if(err) { return handleError(res, err); }
      if(!payment) { return res.status(404).send('Not Found'); }
      
    var paymentVal = {};
    paymentVal.paymentType = "CCAvenue";
    paymentVal.bank_ref_no = resPayment.bank_ref_no;
    paymentVal.order_status = resPayment.order_status;
    paymentVal.failure_message = resPayment.failure_message;
    paymentVal.payment_mode = resPayment.payment_mode;
    paymentVal.card_name = resPayment.card_name;
    paymentVal.status_message = resPayment.status_message;
    paymentVal.tracking_id = resPayment.tracking_id;
    payment.ccAvenueRes = paymentVal;

      if(status == "success")
        payment.statusCode = 0;
          
      payment.save(function(err,pys){
        if(err) { return handleError(res, err); }
        else{
          sendPaymentRes(req,res,resPayment);
        }

      });
  });

}

function sendPaymentRes(req,res,resPayment){
  var status = resPayment.order_status.toString().toLowerCase().trim();
  console.log("########param1", resPayment.merchant_param1);
  if(resPayment.merchant_param3 == "mobapp"){
    if (status != 'success')
      res.redirect('http://mobile?payment=failed');
    else
      res.redirect('http://mobile?payment=success');
  }else
    res.redirect("http://"+ resPayment.merchant_param1 +"/paymentresponse/" + resPayment.order_id);
}

function handleError(res, err) {
  return res.status(500).send(err);
}
