'use strict';

var _ = require('lodash');
var Offer = require('./offer.model');
var ApiError = require('../../components/_error');

  exports.create = function(req, res,next) {
    var model = new Offer(req.body);
            model.save(function(err, st) {
            if(err) { return res.status(err.status || 500).send(err); }
                return res.status(200).json({message:"Data saved sucessfully"});
            });
  
  
    };
 
    exports.get = function(req,res){
        var queryParam = req.query;
        var filter = {}; 
         var query = Offer.find(filter);
      
        query.exec(function(err, result){
          if(err){
            return handleError(res, err);
          }
          return res.status(200).json(result);
        });
    };
             
    exports.update = function(req, res) {
      
                req.body.updatedAt = new Date();

                Offer.update({_id:req.params.id},{$set:req.body},function(err){

                 if(err){ 

                      res.status(err.status || 500).send(err);
                  }
                  
                  return res.status(200).json(req.body);

                });
     };
      




