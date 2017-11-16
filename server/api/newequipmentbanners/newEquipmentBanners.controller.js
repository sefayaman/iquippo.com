'use strict';

var _ = require('lodash');
var Seq = require('seq'); 
var NewEquipmentBannerMaster = require('./newEquipmentBanners.model.js');
var Utility = require('./../../components/utility.js');

// Get list of all 
exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  if(queryParam.status)
      filter['status'] = true;
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      };
  }

  var query = NewEquipmentBannerMaster.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res) {
  NewEquipmentBannerMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
    //console.log("res=",res);
     return res.status(200).json({errorCode:0, message:"Data saved sucessfully", data:respo});
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  var filter = {};
  if (req.query.searchStr) {
    filter['$text'] = {
      '$search': "\""+req.query.searchStr+"\""
    };
  }

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,NewEquipmentBannerMaster,filter,{});
    return;    
  }
  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = NewEquipmentBannerMaster.find(filter).sort(sortObj);
  Seq()
  .par(function(){
    var self = this;
    NewEquipmentBannerMaster.count(filter,function(err, counts){
      result.totalItems = counts;
      self(err);
    });
  })
  .par(function(){
    var self = this;
    query.exec(function (err, inputReq) {
        if(err) { return handleError(res, err); }
        result.inputReqs = inputReq;
        self();
       }
    );

  })
  .seq(function(){
    return res.status(200).json(result.inputReqs);
  });
};

// Updates an existing input req in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  NewEquipmentBannerMaster.findById(req.params.id, function (err, inputReq) {
    if (err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    NewEquipmentBannerMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};

// Deletes a input req from the DB.
exports.delete = function(req, res) {
  NewEquipmentBannerMaster.findById(req.params.id, function (err, inputReq) {
    if(err) { return handleError(res, err); }
    if(!inputReq) { return res.status(404).send('Not Found'); }
    inputReq.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.check = function(req, res) {
    var queryParam = req.query;
    var position = queryParam.position;
    var query = NewEquipmentBannerMaster.find({"position":position});
    query.exec(function(err, result) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(result);
    });
}

function handleError(res, err) {
  return res.status(500).send(err);
}
