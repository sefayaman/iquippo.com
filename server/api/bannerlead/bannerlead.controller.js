'use strict';

var _ = require('lodash');
var Model = require('./bannerlead.model');
var Utility = require('./../../components/utility.js');

var CSV_HEADER = {
  "ticket Id" : "ticketId",
  "Name" : "name",
  "Mobile" : "mobile",
  "Email" : "email",
  "State":"state",
  "Product" : "product",
  "Comment" :"comment",
  "Request Date":"createdAt"
}

// Get banner leads
exports.get = function(req, res,next) {
   var queryParam = req.query;
  var filter = {};
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      }
  }

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, Model, filter, {});
    return;
  }

  var query = Model.find(filter).sort({
   _id:-1
  });
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });

};

var requiredParams = ['fname','lname','mobile','state','product'];

exports.create = function(req,res){
  var bodyData = req.body;
  var retVal = requiredParams.every(function(key){
    return bodyData[key];
  });
  if(!retVal)
    return res.status(412).send("Missing parameter");
  var model = new Model(bodyData);
  model.save(function(err){
    if(err)
      return handleError(res,err);
    return res.status(200).send("Request saved successfully.");
  });
}

exports.exportCsv = function(req,res){
  var query = Model.find({}).sort({_id:-1}).limit(10000);
  query.exec(function(err,leads){
      if(err)
        return handleError(res,err);
      var csvStr = ""
      var headers = Object.keys(CSV_HEADER);
      csvStr += headers.join(",");
      csvStr += "\r\n";
      leads.forEach(function(item){
        headers.forEach(function(key){
         var val = _.get(item,CSV_HEADER[key],"");
         if(CSV_HEADER[key] == 'name')
          val = item.fname + " " + item.lname;
         if(CSV_HEADER[key] == 'createdAt'){
          console.log("date123",val);
           val = Utility.toIST(val);
           console.log("date",val);
         }
         
        val = Utility.toCsvValue(val);
        csvStr += val + ",";
        });
         csvStr += "\r\n";
      });
      csvStr = csvStr.substring(0, csvStr.length - 1);
      renderCsv(req,res,csvStr,"bannerlead_")
  });
}

function renderCsv(req,res,csv,csvName){
   var fileName =  csvName + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary'); 
}


function handleError(res, err) {
  return res.status(500).send(err);
}