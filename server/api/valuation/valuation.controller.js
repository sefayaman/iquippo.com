'use strict';

var _ = require('lodash');
var request = require('request');
var ValuationReq = require('./valuation.model');
var PaymentTransaction = require('./../payment/payment.model');
var Seq = require('seq');
var  xlsx = require('xlsx');
var async = require('async');
var moment = require('moment');
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
exports.getAll = function (req, res) {
  ValuationReq.find(function (err, valuations) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(valuations);
  });
};

// Get a single valuation
exports.getOnId = function (req, res) {
  ValuationReq.findById(req.params.id, function (err, valuation) {
    if (err) { return handleError(res, err); }
    if (!valuation) { return res.status(404).send('Not Found'); }
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
exports.getOnFilter = function (req, res) {
  var filter = {};
  var orFilter = [];
  if (req.body.userMobileNos)
    filter['user.mobile'] = { $in: req.body.userMobileNos };

  if (req.body.onlyOldReq)
    filter['enterprise'] = { $exists: false };

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
  if (req.body.searchstr) {
    filter['$text'] = {
    '$search': "\""+req.body.searchstr+"\""
    }
  }

  if (orFilter.length > 0) {
    filter['$or'] = orFilter;
  }

  if (req.body.statusType){
    if(req.body.statusType === 'Cancelled')
      filter['cancelled'] = true;
    else if(req.body.statusType === 'Request On Hold')
      filter['onHold'] = true;
    else {
      filter["status"] = req.body.statusType;
      filter['cancelled'] = false;
      filter['onHold'] = false;
    }
   }

  if (req.body.userId) {
    filter['user._id'] = req.body.userId;
  }
  if (req.body.sellerId) {
    filter['seller._id'] = req.body.sellerId;
    filter['user._id'] = { $ne: req.body.sellerId };
  }

  if (req.body.statuses)
    filter['status'] = { $in: req.body.statuses };

  if (req.body.partnerId)
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
  var bodyData = req.body;
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
exports.update = function (req, res) {
  if (req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  ValuationReq.findById(req.params.id, function (err, valuation) {
    if (err) { return handleError(res, err); }
    if (!valuation) { return res.status(404).send('Not Found'); }
    ValuationReq.update({ _id: req.params.id }, { $set: req.body }, function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(req.body);
    });
  });
};

exports.cancelRequest = function(req,res){
  var bodyData = req.body;
  if(!bodyData._id)
    return res.status(400).send("Invalid cancel request !!!");
  if(req.user.role === 'admin')
    return cancelRequestAtQVAPL();

  // ValuationReq.findById(bodyData._id,function(err,entReq){
  //   if(err) return handleError(res, err);
  //   if(!entReq)
  //     return res.status(404).send("Valuation request not found !!!");
  //   if(entReq.enterprise.enterpriseId === req.user.enterpriseId)
  //     cancelRequestAtQVAPL();
  //   else
  //     return res.status(401).send("Invalid cancel request !!!");
  // });

  function cancelRequestAtQVAPL(){
    if(!bodyData.jobId || bodyData.cancelled)
      return update();

    var serverData = {};
    serverData.uniqueControlNo = bodyData.uniqueControlNo;
    serverData.jobId = bodyData.jobId;
    //serverData.cancellationFee = bodyData.cancellationFee || 0; 
    request({
        url: config.qpvalURL + "?type=cancel",
        method: "POST",
        json: true, 
        body: [serverData]
    }, function (error, response, body){
      if(error)
        return res.status(412).send("Unable to cancel request.Please contact support team");  
      if(response.statusCode == 200 && response.body.length && response.body[0] && response.body[0].success === 'true'){
          update();
      }else
        return res.status(412).send("Unable to cancel request.Please contact support team");
    });
  }

  function update(){
    ValuationReq.findById(bodyData._id,function(err,result){
      //var updateData = {};
      result.cancelled = true;
      //updateData.cancellationFee = bodyData.cancellationFee || 0; 
      result.cancelledBy = {
        userId:req.user._id,
        name:req.user.fname || "" + " " + req.user.lname || "",
        email:req.user.email,
        mobile:req.user.mobile,
        createdAt : new Date() 
      }
      result.status = IndividualValuationStatuses[8];
      var stObj = {};
      stObj.status = IndividualValuationStatuses[8];
      stObj.createdAt = new Date();
      stObj.userId = req.user._id;
      stObj.name = req.user.fname + " " + req.user.lname;
      stObj.mobile = req.user.mobile;
      stObj.email = req.user.email;
      if(!result.statuses)
        result.statuses = [];
      result.statuses[result.statuses.length] = stObj;
      result.updatedAt = new Date();
      delete result._id;
      ValuationReq.update({_id:bodyData._id},{$set:result},function(err,retVal){
        if(err) return handleError(res, err);
        return res.status(200).send("Valuation request cancelled successfully !!!");
      });
    });
  }

}

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
      if(invoiceData.selectedTaxes && invoiceData.selectedTaxes.length){
        invoiceData.selectedTaxes.forEach(function(tax){
          if(taxColms.indexOf(tax.type) !== -1)
            data[tax.type] = tax;
        });
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
exports.destroy = function (req, res) {
  ValuationReq.findById(req.params.id, function (err, valuation) {
    if (err) { return handleError(res, err); }
    if (!valuation) { return res.status(404).send('Not Found'); }
    valuation.remove(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

  exports.exportValuation = function(req,res){
    var filter = {};
    if(req.body.userid)
      filter["user._id"] = req.body.userid;
    if(req.body.userMobileNos)
      filter['user.mobile'] = {$in: req.body.userMobileNos.split(',')};
    if (req.body.onlyOldReq)
      filter['enterprise'] = { $exists: false };
    if(req.body.partnerId)
      filter['valuationAgency._id'] = req.body.partnerId;
    var dateFilter = {};

    if(req.body.fromDate)
    dateFilter['$gte'] = new Date(req.body.fromDate);
    if(req.body.toDate) {
        var toDate = new Date(req.body.toDate);
        var nextDay = toDate.getDate() + 1;
        toDate.setDate(nextDay);
        dateFilter.$lt = toDate;
    }
    if(req.body.fromDate || req.body.toDate)
      filter['createdAt'] = dateFilter;

    var fieldMap = fieldsConfig["EXPORT"];
    var query = ValuationReq.find(filter).sort({createdAt:-1});
    query.exec(function(err,dataArr){
        if(err) { return handleError(res, err); }
        exportExcel(req,res,fieldMap,dataArr);
    })
}

function exportExcel(req,res,fieldMap,jsonArr){
  //var queryParam = req.query;
  //var role = queryParam.role;
  //var dataArr = [];
  var headers = Object.keys(fieldMap);
  /*var allowedHeaders = [];
  for(var i=0;i < headers.length;i++){
      var hd = headers[i];
      var obj = fieldMap[hd];
      if(obj.allowedRoles && obj.allowedRoles.indexOf(role) == -1){
        continue;
      }
      allowedHeaders.push(hd);
  }*/
  var str = headers.join(",");
  str += "\r\n";
  //dataArr.push(allowedHeaders);
  jsonArr.forEach(function(item,idx){
    //dataArr[idx + 1] = [];
    headers.forEach(function(header){
      var keyObj = fieldMap[header];
      var val = _.get(item,keyObj.key,"");
      if(keyObj.type && keyObj.type == 'boolean')
          val = val?'YES':'NO';
      if(keyObj.type && keyObj.type == 'date' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
      if(keyObj.type && keyObj.type == 'datetime' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY HH:mm');
      if(keyObj.type && keyObj.type == 'url' && val){
        if(val.filename){
          if(val.external === true)
          val = val.filename;
          else
            val =  req.protocol + "://" + req.headers.host + "/download/"+ item.assetDir + "/" + val.filename || "";
        }else
          val = "";
      }
      if (keyObj.key && keyObj.key === 'userName' && item.user)
        val = item.user.fname + " " + item.user.lname;
      if(keyObj.key === 'paymentReceived' && keyObj.type && keyObj.type == 'boolean') {
        var statusesArr = [];
        item.statuses.forEach(function(item){
            statusesArr.push(item.status);
        });
        if(statusesArr.indexOf(IndividualValuationStatuses[1]) > -1)
          val = 'YES'
        else
          val = 'NO';
      }
      val = Utility.toCsvValue(val);
      str += val + ",";
    });
    str += "\r\n";
  });
  var csvName = "valuation_";
  str = str.substring(0,str.length -1);

  return  renderCsv(req,res,str, csvName);
}

function renderCsv(req,res,csv,csvName){
  var fileName = csvName + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary'); 
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
      if(fieldMap[key] === 'customerName' && valReqs.user)
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
    //console.log("dataArr####",dataArr);
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
    //console.log("response.body####",resObj);
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

exports.resumeRequest = function(req,res){
  var bodyData = req.body;
  if(!bodyData._id)
    return res.status(400).send("Invalid resume request request !!!");

  ValuationReq.findById(bodyData._id,function(err,valReqs){
    if(err) return handleError(res, err);
    if(!valReqs)
      return res.status(404).send("Valuation request not found !!!");
    if(!valReqs.onHold)
      return res.status(401).send("Request is not on hold !!!");
    if(req.user.role == 'admin')
      return resumeRequestAtQVAPL(valReqs);
    else
      return res.status(401).send("Invalid resume request !!!");
  });

  function resumeRequestAtQVAPL(valReqs){
    if(!bodyData.jobId)
      return res.status(401).send("Invalid resume request !!!");
    var fieldMap = fieldsConfig.SUBMITTED_TO_AGENCY_FIELD;
    var servObj = {};
    var keys = Object.keys(fieldMap);
    keys.forEach(function(key){
      servObj[key] = _.get(valReqs,fieldMap[key],"");
      if(fieldMap[key] === 'customerName' && valReqs.user)
        servObj[key] = valReqs.user.fname + " " + valReqs.user.lname;
      if(fieldMap[key] === 'customerInvoiceDate' && valReqs.invoiceData && valReqs.invoiceData.invoiceDate)
        servObj[key] = valReqs.invoiceData.invoiceDate;
    })
    // var s3Path = "";
    // if(bodyData.assetDir)
    //   s3Path = config.awsUrl + config.awsBucket + "/" + bodyData.assetDir + "/";
    // if(s3Path && bodyData.invoiceDoc&& bodyData.invoiceDoc.filename)
    //     servObj.invoiceDoc = s3Path + bodyData.invoiceDoc.filename;
    // if(s3Path && bodyData.rcDoc && bodyData.rcDoc.filename)
    //     servObj.rcDoc = s3Path + bodyData.rcDoc.filename;
    if(valReqs.userComment)
      servObj.comment = valReqs.userComment;
    servObj.jobId = valReqs.jobId;
    request({
        url: config.qpvalURL + "?type=jobResume",
        method: "POST",
        json: true, 
        body: [servObj]
    }, function (error, response, body){
      if(error)
        return res.status(412).send("Unable to resume request.Please contact support team");  
      if(response.statusCode == 200 && response.body.length && response.body[0] && response.body[0].success === 'true'){
          bodyData.onHold = false;
          update();
      }else{
        return res.status(412).send("Unable to resume request.Please contact support team");
      }
    });
  }

  function update(){
    var _id = bodyData._id;
    delete bodyData._id;
    bodyData.resumeDate = new Date();
    bodyData.resumedBy = {
      userId:req.user._id,
      name:req.user.fname || "" + " " + req.user.lname || "",
      email:req.user.email,
      mobile:req.user.mobile,
      createdAt : new Date() 
    }
    ValuationReq.update({_id:_id},{$set:bodyData},function(err,retVal){
      if(err) return handleError(res, err);
      return res.status(200).send("Valuation request resumed successfully !!!");
    }); 
  }
}

exports.updateFromAgency = function(req,res){
  var validActions = ['reportupload','putonhold'];  
  var bodyData = req.body;
  var action = req.query.action;
  //console.log("reportupload req##", bodyData);
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
  if(action == 'putonhold')
    parameters = fieldsConfig.PUT_ON_HOLD;
  else
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

    if(action === 'putonhold'){
      updateObj.onHold = true;
      updateObj.onHoldDate = new Date();
    } else {
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
