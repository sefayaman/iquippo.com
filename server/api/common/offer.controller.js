'use strict';

var _ = require('lodash');
var Offer = require('./offer.model');
var OfferRequest = require('./newofferrequest.model');
var ApiError = require('../../components/_error');

  exports.create = function(req, res,next) {
      var model = new Offer(req.body);
            model.save(function(err, st) {
            if(err) { return res.status(500).send(err); }
                return res.status(200).json({message:"Data saved sucessfully"});
            });
  
  
    };
 
    exports.get = function(req,res){
        var queryParam = req.query;
        var filter = {};
        if (queryParam.searchStr) {
            filter['$text'] = {
              '$search': "\""+queryParam.searchStr+"\""
            }
        }
         if (queryParam.location) {
            filter['$text'] = {
              '$search': "\""+queryParam.location+"\""
            }
        }
        if (queryParam.status)
          filter.status = queryParam.status;
        if (queryParam.category)
          filter.category.id = queryParam.category;
        if (queryParam.brand)
          filter.brand.id = queryParam.brand;
        if (queryParam.model)
          filter.model.id = queryParam.model;
        if (queryParam.stateName)
          filter['location.name'] = queryParam.stateName;
        var query = Offer.find(filter);
        query.exec(function(err, result) {
          if (err) {
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
      
     exports.destroy = function(req, res, next) {
      Offer.findById(req.params.id, function(err, oneRow) {
        if (err) {
          return handleError(res, err);
        }
        if (!oneRow) {
          return next(new ApiError(404, "Not found"));
        }
        oneRow.remove(function(err) {
          if (err) {
            return handleError(res, err);
          }
          return res.status(204).send({
            message: "Data deleted sucessfully!!!"
          });
        });
      });
    };

    //Offer request api

 exports.createOfferRequest = function(req, res,next) {
      var model = new OfferRequest(req.body);
      model.save(function(err, st) {
      if(err) { return res.status(500).send(err); }
          return res.status(200).send("Your request submitted successfully");
      });
  };

