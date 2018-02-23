  'use strict';

var _ = require('lodash');
var request = require('request');
var ValuationReq = require('./valuation.model');
var PaymentTransaction = require('./../payment/payment.model');
var Seq = require('seq');
var  xlsx = require('xlsx');
var async = require('async');
var writtenFrom = require('written-number');
var Utility = require('./../../components/utility.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var Product = require('./../product/product.model');
var fs = require('fs');
var Handlebars = require('handlebars');
var pdf = require('html-pdf');
var validator = require('validator');
var minify = require('html-minifier').minify;
var fieldsConfig = require('./fieldsConfig');
var IndividualValuationStatuses = ['Request Initiated','Payment Completed','Request Failed','Request Submitted','Invoice Generated','Report Failed','Report Submitted','Completed', 'Cancelled'];

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
  
  if(!req.body.valuation.product._id)
    createValuationReq(req,res);
  else {
    var productId = req.body.valuation.product._id;
    createValuationReq(req,res);
  }
};
  
function createValuationReq(req,res) {
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
        req.body.valuation.transactionIdRef = req.transactionId;
        ValuationReq.create(req.body.valuation, function(err, valuation) {
          if(err){return handleError(err,res)}
            else{
              var resObj = {}
              resObj.valuation = valuation;
              resObj.transactionId = valuation.transactionId;
              resObj.errorCode = 0;
              return res.status(200).json(resObj);
            }
          });
      })
}

//search based on filter
exports.getOnFilter = function(req, res) {

  var filter = {};
  var orFilter = [];
  if(req.body.userMobileNos)
    filter['user.mobile'] = {$in:req.body.userMobileNos};

  /*if(req.body.searchstr){
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
  }*/
  if (req.body.searchStr) {
    filter['$text'] = {
    '$search': "\""+req.body.searchStr+"\""
    }
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
    paginatedResult(req,res,ValuationReq,filter);
    return;
  }

  var query = ValuationReq.find(filter);
  /*query.exec(
               function (err, valuations) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(valuations);
               }
  );*/
  query.populate('transactionIdRef')
    .exec(function(err, valuations) {
      if(err) { return handleError(res, err); }
      return res.status(200).json(valuations);
  });
};

function paginatedResult(req, res, modelRef, filter) {
    
    var bodyData = req.query;

  var pageSize = bodyData.itemsPerPage || 50;
  var first_id = bodyData.first_id;
  var last_id = bodyData.last_id;
  var currentPage = bodyData.currentPage || 1;
  var prevPage = bodyData.prevPage || 0;
  var isNext = currentPage - prevPage >= 0 ? true : false;
  
  async.parallel({count:_count,result:_getResult},function(err,resObj){
    if(err) return handleError(res,err);
    return res.status(200).json({totalItems:resObj.count,items:resObj.result});
  });
  
  function _count(cb){
    modelRef.count(filter, function(err, counts) {
      cb(err,counts);
    });
  }

  function _getResult(cb){

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
      query.populate('transactionIdRef')
      .exec(function(err, items) {
        if (!err && items.length > pageSize * (skipNumber - 1)) {
          items = items.slice(pageSize * (skipNumber - 1), items.length);
        } else
          items = [];
        if (!isNext && items.length > 0)
          items.reverse();
        cb(err,items);
      });
  }
}

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
//generate invoice
exports.generateInvoice = function(req,res){
  var ivNo = req.params.ivNo;
  if(!ivNo){
    return res.status(412).json({Err:'Invalid request'});
  }
  ValuationReq.findById(ivNo, function (err, indvReq) {
    if (err) { return handleError(res, err); }
    if(!indvReq) { return res.status(404).send('Not Found'); }
    generateInvoice(req,res,indvReq);
  });
};

function generateInvoice(req,res,indvReq){
    var invoiceData =  indvReq.invoiceData;
    fs.readFile(__dirname + '/../../views/emailTemplates/IndividualValuation_Invoice.html', 'utf8', function(err, source) {
     if (err) {
        return handleError(res, err);
      }

      source = source.toString();
      //source += '</body></html>';
      var template = Handlebars.compile(source);

      var descriptionD = invoiceData.requestType + " of";
      if(invoiceData.requestCount == 1){
        descriptionD += " " + invoiceData.assetCategory;
      }else
        descriptionD += " various assets as per annexure."
      var invoiceInWords = "";
      invoiceInWords = writtenFrom(invoiceData.invoiceAmount,{lang:'enIndian'});
      if(invoiceInWords)
        invoiceInWords += " only."
      if(invoiceInWords && invoiceInWords.length > 4){
        invoiceInWords = invoiceInWords.charAt(0).toUpperCase() + invoiceInWords.slice(1)
      }
      var invsDate = new Date(invoiceData.invoiceDate);
      var data = {
        valReqs : indvReq,
        descriptionD:descriptionD,
        invoiceInWords:invoiceInWords,
        descriptionHd: invoiceData.requestType + " fee towards",
        invoiceData : invoiceData,
        invoiceDate : Utility.dateUtil.validateAndFormatDate(invsDate,'DD-MM-YYYY'),
        serverPath:config.serverPath,
        awsBaseImagePath:config.awsUrl + '/' + config.awsBucket
      };
      var taxColms = ['CGST','SGST','IGST'];
      if(taxColms.indexOf(invoiceData.taxType) !== -1) {
        var tempObj = {};
        tempObj.type = invoiceData.taxType;
        tempObj.rate = invoiceData.gstPer;
        tempObj.calculatedTax = invoiceData.gst;
        data[tempObj.type] = tempObj;
      }

      var result = template(data);
      var pdfInput = minify(result, {
        removeAttributeQuotes: true
      });

      var options = {
        height: "15.5in",        // allowed units: mm, cm, in, px 
        width: "10in",
        border: {
          "top": "2mm",            // default is 0, units: mm, cm, in, px 
          "right": "1mm",
          "bottom": "2mm",
          "left": "1.5mm"
        }
      };

      pdf.create(pdfInput, options).toStream(function (err, pdfOutput) {
        if (!err){
          res.setHeader('Content-disposition', 'inline; filename=invoice.pdf');
          res.setHeader('Content-type', 'application/pdf');
          pdfOutput.pipe(res);
        } else {
          console.log('err',err);
          res.send(new APIError(400,'Error while creating invoice'));
        }
      });
    });
}

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
      if(valuation && typeof valuation.product.category === 'string')
        cell =  {v: valuation.product.category || ""};
      else
        cell =  {v: valuation.product.category.name || ""};
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

exports.submitRequest = function(req,res){
  var subData = req.body;
  var type = req.query.type;
  if(['Mjobcreation','Mjobupdation'].indexOf(type) === -1)
    return res.status(400).send("Invalid type parameter");
  if(!subData)
    return res.status(400).send("Invalid request");
  var fieldMap = fieldsConfig.SUBMITTED_TO_AGENCY_FIELD;
  ValuationReq.find({_id:req.body._id},function(err,valReqs){
    if(err) return handleError(res, err);

    if(!valReqs.length)
      return res.status(200).send("No record found to submit");

    postRequest(valReqs[0]);
  });

  function postRequest(valReqs){
    var dataArr = [];
    var keys = Object.keys(fieldMap);
    if(type === 'Mjobcreation' && valReqs.jobId)
      return;
    if(type === 'Mjobupdation' && !valReqs.jobId)
      return;

    var obj = {};
    keys.forEach(function(key){
      obj[key] = _.get(valReqs,fieldMap[key],"");
      if(fieldMap[key] === 'customerName')
        obj[key] = valReqs.user.fname + " " + valReqs.user.lname;
      if(fieldMap[key] === 'customerInvoiceDate' && valReqs.invoiceData && valReqs.invoiceData.invoiceDate)
        obj[key] = valReqs.invoiceData.invoiceDate;
    })
    // if(obj && obj.customerName) {

    // }
    // if(obj.brand && obj.brand == "Other")
    //   obj.brand = valReqs.otherBrand;

    // if(obj.model && obj.model == "Other")
    //   obj.model = valReqs.otherModel;

    if(type === 'Mjobupdation' && valReqs.jobId)
      obj.jobId = valReqs.jobId;

    dataArr[dataArr.length] = obj;

    if(!dataArr.length)
      return res.status(200).send("There is no request to post.");
    console.log("dataArr####",dataArr);
    request({
        url: config.qpvalURL + "?type=" + type,
        method: "POST",
        json: true, 
        body: dataArr
    }, function (error, response, body){
      if(error)
         return res.status(412).send("Unable to post request to agency.Please contact support team.");
      if(response.statusCode == 200){
        requestPostProcessing(valReqs,response.body);
      }else{
        return res.status(412).send("Unable to post request to agency.Please contact support team");
      }

    });
  }

  function requestPostProcessing(valReqs,resList){
    var resObj = resList[0];
    console.log("response.body####",resObj);
    if(type === 'Mjobcreation'){
      if(resObj.success === 'true'){
        valReqs.jobId = resObj.jobId;
        valReqs.submittedToAgencyDate = new Date();
        valReqs.remarks = "";
        valReqs.resubmit = false;
        setStatus(valReqs,IndividualValuationStatuses[3]);
      }else{
        valReqs.remarks = resObj.msg || "Unable to submit";
        valReqs.resubmit = true;
        setStatus(valReqs,IndividualValuationStatuses[2]);
      }
      //return;
    }
    update(valReqs);
  }

  function update(valReqs){
    var _id = valReqs._id;
    delete valReqs._id;
    ValuationReq.update({_id:_id},{$set:valReqs},function(err,retVal){
      // if(!err && type === 'Mjobcreation')
      //   pushNotification(valReqs);
      return res.status(200).send("Valuation request submitted successfully !!!");
    }); 
  }

   function setStatus(entValuation,status,doNotChangeStatus){
      if(!doNotChangeStatus)
        entValuation.status = status;
      var stObj = {};
      stObj.status = status;
      stObj.createdAt = new Date();
      stObj.userId = req.user._id;
      stObj.name = req.user.fname + " " + req.user.lname;
      stObj.mobile = req.user.mobile;
      stObj.email = req.user.email;
      if(!entValuation.statuses)
        entValuation.statuses = [];
      entValuation.statuses.push(stObj);
    }
}

exports.updateFromAgency = function(req,res){
  var validActions = ['reportupload'];  
  var bodyData = req.body;
  var action = req.query.action;
  console.log("reportupload req##", bodyData);
  var result = {};
  result['success'] = true;
  result['jobID'] = bodyData.jobID;
  result['unique_controll_no']= bodyData.unique_controll_no;

  if(validActions.indexOf(action) === -1){
    result['success'] = false;
    result['msg'] = "Invalid action";
    return sendResponse();
  }

  var generalCond = req.body.overallGeneralCondition;
  if(generalCond){
   var bufferObj = new Buffer(generalCond, 'base64');
   req.body.overallGeneralCondition = bufferObj.toString('utf8');
  }
  var parameters = null;
  parameters = fieldsConfig.REPORT_UPLOAD;

  var msg = validateRequest(bodyData);
  if(msg){
    result['msg'] = msg;
    result['success'] = false;
    return sendResponse();
  }

  checkRecordInDB(bodyData.unique_controll_no,function(msg,valReq){
    if(msg){
       result['msg'] = msg;
       result['success'] = false;
       return sendResponse();
    }else
        update(valReq);      

  });

  function update(valReq){
    var keys = Object.keys(parameters);
    var updateObj = {};
    keys.forEach(function(key){
      var val = bodyData[key];
      if(!parameters[key].type == 'boolean')
        val = val == 'YES' || val == 'yes'?true:false;
      if(parameters[key].type == 'file'){
        var valObj = {external:true};
        valObj.filename = val;
        val = valObj;
       }
       if(val)
        updateObj[parameters[key].key] = val;
    });

    updateObj.status = IndividualValuationStatuses[6];
    updateObj.statuses = valReq.statuses;
    updateObj.reportDate = new Date();
    var stsObj = {};
    stsObj.createdAt = new Date();
    stsObj.userId = "IQVL";
    stsObj.status = IndividualValuationStatuses[6];
    if(updateObj.statuses)
      updateObj.statuses[updateObj.statuses.length] = stsObj;

    var statusesArr = [];
    updateObj.statuses.forEach(function(item){
        statusesArr.push(item.status);
    });
    
    if(statusesArr.indexOf(IndividualValuationStatuses[1]) > -1 
      && statusesArr.indexOf(IndividualValuationStatuses[3]) > -1 
      && statusesArr.indexOf(IndividualValuationStatuses[4]) > -1) {
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = "IQVL";
      stsObj.status = IndividualValuationStatuses[7];
      updateObj.statuses[updateObj.statuses.length] = stsObj;
      updateObj.status = IndividualValuationStatuses[7];
    }

    ValuationReq.update({_id:valReq._id},{$set:updateObj},function(err){
        if(err){
           result['success'] = false;
           result['msg'] = "System error at iQuippo";
        }
        //if(action === 'reportupload')
          //pushNotification(valReq);
        return sendResponse();
    });
  }

  function sendResponse(){
    res.status(200).json(result);
  }

  function checkRecordInDB(unCtlNo,cb){
    ValuationReq.find({requestId:unCtlNo},function(err,valArr){
      var msg = "";
      if(err){
         msg = "System error at iQuippo";
      }else if(valArr.length === 0){
          msg = "Record not found at iQuippo";
      }
      if(msg)
        return cb(msg);
      else  
        return cb(null,valArr[0]);
    })
  }

  function validateRequest(reqData){
    var msg = "";
    var keys = Object.keys(parameters);
    for(var i=0;i < keys.length;i++){

      var key = keys[i];
      var keyObj = parameters[key];
      var value = reqData[key];
      if(keyObj.required && !value){
        msg = key + " is missing";
        break;
      }

      if(keyObj.type){
        var retVal = valiadeDataType(value,keyObj.type);
          if(!retVal){
            msg = key + " must be of " + keyObj.type + " type";
        }
      }
    }
    return msg;
  }
}
function valiadeDataType(val,type){
  var ret = true; 
  switch(type){
    case"numeric":
      ret = !isNaN(val);
    break;
    case "file":
      ret = true;
    break;
  }
  return ret;
}
function handleError(res, err) {
  return res.status(500).send(err);
}
