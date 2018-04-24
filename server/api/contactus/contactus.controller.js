'use strict';

var _ = require('lodash');
var ContactUs = require('./contactus.model');
var Utility = require('./../../components/utility.js');
var xlsx = require('xlsx');

// Get list of contacts
exports.getAll = function (req, res) {
  ContactUs.find(function (err, contacts) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(contacts);
  });
};

// Get a single contact
exports.getOnId = function (req, res) {
  ContactUs.findById(req.params.id, function (err, contact) {
    if (err) { return handleError(res, err); }
    if (!contact) { return res.status(404).send('Not Found'); }
    return res.json(contact);
  });
};

// Creates a new contact in the DB.
exports.create = function (req, res) {
  req.body.createdAt = new Date();
  ContactUs.create(req.body, function (err, contact) {
    if (err) { return handleError(res, err); }
    return res.status(201).json(contact);
  });
};

//search based on filter
exports.getOnFilter = function (req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  if (req.body.userMobileNos)
    filter['mobile'] = { $in: req.body.userMobileNos };
  var arr = [];
  if (req.body.searchstr) {
    arr[arr.length] = { name: { $regex: searchStrReg } };
    arr[arr.length] = { mobile: { $regex: searchStrReg } };
    arr[arr.length] = { email: { $regex: searchStrReg } };
    arr[arr.length] = { country: { $regex: searchStrReg } };
    arr[arr.length] = { message: { $regex: searchStrReg } };
    arr[arr.length] = { ticketId: { $regex: searchStrReg } };
  }

  if (arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if (req.body.pagination) {
    Utility.paginatedResult(req, res, ContactUs, filter, {});
    return;
  }

  var sortObj = {};
  if (req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = ContactUs.find(filter).sort(sortObj);
  query.exec(
    function (err, contacts) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(contacts);
    }
  );
};

var CONTACTUS_FIELD_MAP = {
  'Ticket Id': 'ticketId',
  'Full Name': 'name',
  'Country': 'country',
  'Mobile No.': 'mobile',
  'Email Address': 'email',
  'Comments': 'message',
  'Date of Request': 'createdAt'
};

exports.exportContactus = function (req, res) {
  var filter = {};
  if (req.body.userMobileNos) {
    filter['mobile'] = { $in: req.body.userMobileNos.split(',') };
  }

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

  ContactUs.find(filter).sort({ createdAt: -1 }).lean().exec(function (err, contacts) {
    if (err) { return handleError(res, err); }
    return _prepareResponse(res, contacts);
  });

  function _prepareResponse(res, contacts) {
    var tempData = [];
    contacts.forEach(function (contact, key, array) {
      delete array[key]._id;
      tempData.push({
        "Sr. No": key + 1,
        "Ticket Id": contact.ticketId,
        "Full Name": contact.name,
        "Country": contact.country,
        "Mobile No.": contact.mobile,
        "Email Address": contact.email,
        "Comments": contact.message,
        "Date of Request": Utility.toDanishDate(contact.createdAt)
      });
    });

    try {
      Utility.convertToCSV(res, tempData);
    } catch (excp) {
      throw excp;
    }
  }

  // query.exec(
  //    function (err, contacts) {
  //       if(err) { return handleError(res, err); }
  //       var dataArr = [];
  //       var headers = Object.keys(CONTACTUS_FIELD_MAP);
  //       dataArr.push(headers);
  //       contacts.forEach(function(item, idx){
  //         dataArr[idx + 1] = [];
  //         headers.forEach(function(header){
  //           if(CONTACTUS_FIELD_MAP[header] == 'createdAt') {
  //             dataArr[idx + 1].push(Utility.toIST(_.get(item, 'createdAt', '')));
  //           }
  //           else
  //             dataArr[idx + 1].push(_.get(item,CONTACTUS_FIELD_MAP[header],''));
  //         });
  //       });

  //       var ws_name = "Report_" + new Date().getTime();
  //       var wb = Utility.getWorkbook();
  //       var ws = Utility.excel_from_data(dataArr,headers);
  //       wb.SheetNames.push(ws_name);
  //       wb.Sheets[ws_name] = ws;
  //       console.log("ws", ws);
  //       var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
  //       res.end(wbout);
  //    });
}

function handleError(res, err) {
  return res.status(500).send(err);
}