'use strict';

var _ = require('lodash');
var Seq = require("seq");
var trim = require('trim');
var LeadMaster = require('./leadmasterdata.model');

var xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var ApiError = require('./../../components/_error.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";

// Get list of auctions

var APIError = require('../../components/_error');
var async = require('async');
var debug = require('debug')('api.finance');
var uploadReqCtrl = require('../common/uploadrequest/uploadrequest.controller');
var moment = require('moment');
var validDateFormat = ['DD/MM/YYYY','MM/DD/YYYY','YYYY/MM/DD'];
var validTimeFormat = ['DD/MM/YYYY h:mmA','DD/MM/YYYY h:mm A','MM/DD/YYYY h:mm A'];

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
      return {_isValid : false}
    return moment(dateTimeString,format);
  }
}

exports.getAll = function(req, res) {
  LeadMaster.find(function(err, leads) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(leads);
  });
};


  function finalize(err) {
    if (err)
      debug(err);

    if (errObj.length && !sucessObj.length)
      return cb({
        Error: 'Error while inserting these data:' + errObj.toString(),
        errObj: errObj
      });

    if (sucessObj.length && !errObj.length)
      return cb(null, {
        Error: '',
        sucessObj: sucessObj
      });

    if (errObj.length && sucessObj.length)
      return cb({
        Error: 'Error while inserting these data:' + errObj.toString() +
          'Inserted Successfully:' + sucessObj.toString(),
        sucessObj: sucessObj,
        errObj: errObj
      });
  }

//}




function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}


//search LeadMaster based on filter 
exports.getFilterOnLeadMaster = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchStr, 'i');
  var filter = {};
  if (req.body._id)
    filter["_id"] = req.body._id;
  if (req.body.url)
    filter["leadId"] = req.body.lead;
  
  var arr = [];

  if (req.body.searchStr) {
    arr[arr.length] = {
      leadId: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      customerName: {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      mobile: {
        $regex: searchStrReg
      }
    };

  }

  if (arr.length > 0)
    filter['$or'] = arr;

  var result = {};

if (req.body.pagination && !req.body.statusType) {
    return Utility.paginatedResult(req, res, LeadMaster, filter, {},function(results){
     
        return res.status(200).json(results);
     
    });
}

 var query = LeadMaster.find(filter);
  query.exec(
    function(err, items) {
      if (err) {
        return handleError(res, err);
      }
      var result={};
        result.items=items;
       return res.status(200).json(result);   
    });
};


exports.getLeadMaster = function(req, res) {
  var filter = {};
  var queryObj = req.query;
  /*if (queryObj.yetToStartDate)
    filter['startDate'] = {
      '$gt': new Date()
    }*/
  var query = LeadMaster.find().sort({
    _id: -1
  })
  query.exec(function(err, leads) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(leads);
  });
}


exports.rapitApi = function(req, res) {
  var filter = {};
 
 LeadMaster.create(req.body, function(err, leadData) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json({
          errorCode: 0,
          message: "Save succesfully."
        });
      });
}
//export data into excel
function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}
function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function setType(cell) {
  if (typeof cell.v === 'number')
    cell.t = 'n';
  else if (typeof cell.v === 'boolean')
    cell.t = 'b';
  else if (cell.v instanceof Date) {
    cell.t = 'n';
    cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  } else cell.t = 's';
}

function excel_from_data(data) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:18, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    
    var C = 0;
    var lead = null;
    var cell = null;
    if(R != 0)
      lead = data[R-1];

    if(R === 0)
      cell = {v: "Lead Id"};
    else {
      if(lead)
        cell = {v: lead.leadId || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    ws[cell_ref] = cell;

    /*if(R == 0)
      cell = {v: "Name"};
    else{
      if(user)
        cell =  {v: (user.fname || "") + " " + (user.mname || "") + " " + (user.lname || "")};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;*/
    
    if(R == 0)
      cell = {v: "Customer Name"};
    else {
      if(lead)
        cell = {v: lead.customerName || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "mobile"};
    else {
      if(lead)
        cell = {v: lead.mobile || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Asset Name"};
    else {
      if(lead)
        cell = {v: lead.assetName || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Offer"};
    else {
      if(lead)
        cell = {v: lead.offerDetail || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "Status"};
    else {
      if(lead)
        cell = {v: lead.status || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

function isStatus(status, deleted) {
  if (status && !deleted)
    return "Active";
  else if (!status && !deleted)
    return "Deactive";
  else if (!status && deleted)
    return "Deleted";
  else
    return "";
}
exports.exportLeads = function(req, res) {
  var filter = {};
 /* filter.deleted = false;
  if (req.body.userId) {
    filter.createdBy._id = req.body.userId;
  }
  if (req.body.enterpriseId) {
    filter.enterpriseId = req.body.enterpriseId;
  }
  if (req.body.filter)
    filter = req.body.filter;
    */
  var query = LeadMaster.find(filter).sort({
    _id: -1
  });
  query.exec(
    function(err, items) {
     if (err) {
        return handleError(res, err);
      }
      var result={};
        result.items=items;
       //return res.status(200).json(result); 
     var ws_name = "leaddata"
        var wb = new Workbook();
        var ws = excel_from_data(items);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
    });
    
}

exports.getLeadIdFilterOnLeadMaster = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchStr, 'i');
  var filter = {};
  filter["leadId"] = req.body.searchStr;
  var result = {};

if (req.body.pagination && !req.body.statusType) {
    return Utility.paginatedResult(req, res, LeadMaster, filter, {},function(results){
        return res.status(200).json(results);
    });
}
 var query = LeadMaster.findOne(filter);
  query.exec(
    function(err, items) {
      if (err) {
        return handleError(res, err);
      }
      var result={};
        result.items=items;
       return res.status(200).json(result);   
    });
};

/* end of financemaster */
function handleError(res, err) {
  return res.status(500).send(err);
}


