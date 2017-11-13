'use strict';

var _ = require('lodash');
var Seq = require('seq');
var CertificateMaster = require('./certificatemaster.model.js');
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

  var query = CertificateMaster.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res) {
  CertificateMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Data saved sucessfully", data:respo});
  });
};


// Updates an existing input req in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  CertificateMaster.findById(req.params.id, function (err, inputReq) {
    if (err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    CertificateMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};

// Deletes a input req from the DB.
exports.delete = function(req, res) {
  CertificateMaster.findById(req.params.id, function (err, inputReq) {
    if(err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    inputReq.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
