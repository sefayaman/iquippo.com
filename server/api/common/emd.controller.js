'use strict';

var _ = require('lodash');
var Emd = require('./emd.model');
var ApiError = require('../../components/_error');
var async = require('async');

      exports.create = function(req, res,next) {

          var model = new Emd(req.body);
          model.save(function(err, st) {
          if(err) { return res.status(err.status || 500).send(err); }
          return res.status(200).json({message:"Data saved sucessfully"});
          });



      };

      exports.updateEmdData = function(req, res) {

          req.body.updatedAt = new Date();
          Emd.update({_id:req.params.id},{$set:req.body},function(err){
          if (err) { res.status(err.status || 500).send(err); }
          return res.status(200).json(req.body);
          });

      };

        exports.getEmdData = function(req, res) {
         
          var filter={};
          if(req.query.auctionId){
              filter.auctionId = req.query.auctionId;
          }
          if(req.query.selectedLots){
              filter.selectedLots = req.query.selectedLots;
          }
        console.log(filter);
          var query = Emd.find(filter);
          query.exec(function (err, result) {
          if(err) { res.status(err.status || 500).send(err); }
          console.log("emdresult",result);
          return res.json(result);
          });
        };

        exports.getEmdAmountData = function(req,res,callback){
        var filter ={};
        var data = req.query.selectedLots;


         if (data instanceof Array) {
              var lots = data;
          } else {
        
            var lots = [ data ];
            console.log("lots",lots);
        }
        
        var emdamount =[];
        async.each(lots, function(item, callback){
        filter.auctionId = req.query.auctionId;
        filter.selectedLots = item;
        console.log("item",item);
        Emd.find(filter,function(err,result){

        if (result.length > 0){

        emdamount.push(result[0].amount);

        }

        callback(null);
        });

        },

        function(err){
            
            return res.json(arraySum(emdamount));

        }
        );


        }



        function arraySum(array){  
        var total = 0,
        len = array.length;

        for (var i = 0; i < len; i++){
        total += parseInt(array[i]);

        }
            return total;
        };

      exports.destroy = function(req, res,next) {
          Emd.findById(req.params.id, function (err, oneRow) {
          if(err) { res.status(err.status || 500).send(err); }
          if(!oneRow) { return next(new ApiError(404,"Not found")); }
          oneRow.remove(function(err) {
          if(err) { res.status(err.status || 500).send(err); }
          return res.status(204).send({message:"Data Successfully deleted!!!"});
          });
      });
      };


