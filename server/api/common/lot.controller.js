'use strict';

var _ = require('lodash');
var Lot = require('./lot.model');
var ApiError = require('../../components/_error');

     exports.create = function(req, res,next) {
          var model = new Lot(req.body);
          model.save(function(err, st) {
          if(err) { return res.status(err.status || 500).send(err); }
          return res.status(200).json({message:"Data saved sucessfully"});
          });
      };

      exports.updateLotData = function(req, res) {

          req.body.updatedAt = new Date();
          Lot.update({_id:req.params.id},{$set:req.body},function(err){
          if (err) { res.status(err.status || 500).send(err); }
          return res.status(200).json(req.body);
          });

      };

     exports.getLotData = function(req, res) {
          var filter={};
          var query = Lot.find(filter);
          query.exec(function (err, result) {
          if(err) { res.status(err.status || 500).send(err); }
          return res.json(result);
          });
        };


      exports.destroy = function(req, res,next) {
          Lot.findById(req.params.id, function (err, oneRow) {
          if(err) { res.status(err.status || 500).send(err); }
          if(!oneRow) { return next(new ApiError(404,"Not found")); }
          oneRow.remove(function(err) {
          if(err) { res.status(err.status || 500).send(err); }
          return res.status(204).send({message:"Data Successfully deleted!!!"});
          });
      });

      };
     

