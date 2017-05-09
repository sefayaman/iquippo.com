'use strict';

var _ = require('lodash');
var Classifiedad = require('./classifiedad.model');

// Get list of classifiedad
exports.getAll = function(req, res) {
  var filter = {};
  filter["status"] = true;
  filter["deleted"] = false;
  Classifiedad.find(filter,function (err, classifiedads) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(classifiedads);
  });
};

// Get a single classifiedad
exports.getOnId = function(req, res) {
  Classifiedad.findById(req.params.id, function (err, classifiedad) {
    if(err) { return handleError(res, err); }
    if(!classifiedad) { return res.status(404).send('Not Found'); }
    return res.json(classifiedad);
  });
};

// Creates a new classifiedad in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  Classifiedad.create(req.body, function(err, classifiedad) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(classifiedad);
  });
};

// Updates an existing classifiedad in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  if(req.body.userInfo) { delete req.body.userInfo; }
  req.body.updatedAt = new Date();
  Classifiedad.findById(req.params.id, function (err, classifiedad) {
    if (err) { return handleError(res, err); }
    if(!classifiedad) { return res.status(404).send('Not Found'); }
    Classifiedad.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

exports.search = function(req, res) {
  var filter = {};
  filter["deleted"] = false;
  if(req.body.status)
    filter["status"] = req.body.status;
  if(req.body.position)
    filter["position"] = req.body.position;
  if(req.body.userid)
    filter["userid"] = req.body.userid;

  var query = Classifiedad.find(filter);
  query.exec(
               function (err, classifiedad) {
                      if(err) { return handleError(res, err); }
                      res.setHeader('Cache-Control', 'private, max-age=2592000');
                      return res.status(200).json(classifiedad);
               }
  );

};
// Deletes a classifiedad from the DB.
exports.destroy = function(req, res) {
  Classifiedad.findById(req.params.id, function (err, classifiedad) {
    if(err) { return handleError(res, err); }
    if(!classifiedad) { return res.status(404).send('Not Found'); }
    classifiedad.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  ///console.log("called >>>>>>>>>",err);
  return res.status(500).send(err);
}