'use strict';

var _ = require('lodash');
var Count = require('./count.model');
var ApiError = require('../../components/_error');

exports.create = function(req, res,next) {
    var model = new Count(req.body);
     model.save(function(err, st) {
        if(err) { return res.status(err.status || 500).send(err); }
         return res.status(200).json({message:"Data saved sucessfully"});
      });
  
  
};

exports.updateAssetListed = function(req, res) {

  req.body.updatedAt = new Date();
   Count.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { res.status(err.status || 500).send(err); }
        return res.status(200).json(req.body);
    });
      
  };


exports.getAssetCount = function(req, res) {

  var filter={};


      if(req.query.counttype){
      filter.key = req.query.counttype;
      }

       var query = Count.find(filter);
       query.exec(function (err, result) {
        if(err) { res.status(err.status || 500).send(err); }
        return res.json(result);
      });
       
  
  

  
};


