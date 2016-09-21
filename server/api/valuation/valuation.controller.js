'use strict';

var _ = require('lodash');
var ValuationReq = require('./valuation.model');

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
  console.log("buyer created");
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  ValuationReq.create(req.body, function(err, valuation) {
        return res.status(201).json(valuation);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {

  var filter = {};
  var orFilter = [];
  if(req.body.userId){
    orFilter[orFilter.length] = {"user._id":req.body.userId};
    orFilter[orFilter.length] = {"seller._id":req.body.userId};
  }
  if(orFilter.length > 0)
    filter['$or'] = orFilter;
  if(req.body.statuses)
       filter['status'] = {$in:req.body.statuses};
  var query = ValuationReq.find(filter);
  console.log("filetr ",filter);
  query.exec(
               function (err, valuations) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(valuations);
               }
  );
};
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

function handleError(res, err) {
  return res.status(500).send(err);
}
