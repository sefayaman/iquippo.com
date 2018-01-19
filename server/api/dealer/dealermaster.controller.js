'use strict';

var _ = require('lodash');
var Seq = require('seq');
var DealerMaster = require('./dealermaster.model.js');
var Utility = require('./../../components/utility.js');

// Get list of all 
exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      }
  }
   if(queryParam.pagination){
      return Utility.paginatedResult(req, res, DealerMaster, filter, {});
    }

  var query = DealerMaster.find(filter);
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res) {
  DealerMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
     return res.status(200).send("Data saved sucessfully");
  });
};

// Updates an existing input req in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  DealerMaster.findById(req.params.id, function (err, inputReq) {
    if (err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    DealerMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).send("Data updated sucessfully");
    });
  });
};

// Deletes a input req from the DB.
exports.delete = function(req, res) {
  DealerMaster.findById(req.params.id, function (err, inputReq) {
    if(err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    inputReq.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.validate = function(req,res,next){
  var bodyData = req.body;
  var filter = {};
  filter['brand.data'] = bodyData.brand.data;
  filter['dealer.data'] = bodyData.dealer.data;
  var query = DealerMaster.find(filter);
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    var isUpdate = req.params.id?true:false;
    if(!isUpdate && result && result.length)
      return res.status(412).send("This dealer already added in this brand if you want add location than you edit this dealer and location!");
    if(isUpdate && result.length && (result.length > 1 || result[0]._id + "" !== req.params.id))
      return res.status(412).send("This dealer master is already exist.");
     return next();
  });
}

function handleError(res, err) {
  return res.status(500).send(err);
}
