'use strict';

var _ = require('lodash');
var PriceTrend = require('./pricetrend.model');
var PriceTrendSurvey = require('./pricetrendsurvey.model');
var Utility = require('./../../components/utility.js');

// Creates a new brand in the DB.
exports.create = function(req, res) {

  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  var filter = {};
  filter["category._id"] = req.body.category._id;
  filter["brand._id"] = req.body.brand._id;
  filter["model._id"] = req.body.model._id;

  filter["mfgYear"] = req.body.mfgYear;
  filter["saleYear"] = req.body.saleYear;

  PriceTrend.find(filter,function (err, trends) {
    if(err) { return handleError(res, err); }
    else if(trends.length > 0){res.status(201).json({errorCode:1,message:"Price trend already exits!!!"});}
    else{
      PriceTrend.create(req.body, function(err, newTrend) {
        if(err) { return handleError(res, err); }
         return res.status(200).json({errorCode:0,message:"Price trend  saved sucessfully"});
       });
    }
    
  });
};


exports.getPriceTrendOnFilter = function(req,res){
  var filter = {};
  if(req.body.categoryId)
    filter['category._id'] = req.body.categoryId;
  if(req.body.brandId)
    filter['brand._id'] = req.body.brandId;
  
  if(req.body.modelId)
    filter['modelId._id'] = req.body.modelIdId;

  if(req.body.mfgYear)
    filter['mfgYear'] = req.body.mfgYear;
  if(req.body.saleYear)
    filter['saleYear'] = req.body.saleYear;

  PriceTrend.find(filter,function(err,result){
   if(err) { return handleError(res, err); }
    return res.status(200).json(result);

  })
}

// Updates an existing auction in the DB.
exports.update = function(req, res) {

  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  var filter = {};
  filter["category._id"] = req.body.category._id;
  filter["brand._id"] = req.body.brand._id;
  filter["model._id"] = req.body.model._id;

  filter["mfgYear"] = req.body.trendValue.mfgYear;
  filter["saleYear"] = req.body.trendValue.saleYear;

  PriceTrend.find(filter, function (err, prTrends) {
    if (err) { return handleError(res, err); }
    if(prTrends.length  == 1 && prTrends[0]._id != req.params.id) { return res.status(201).json({errorCode:1,message:"Duplicate price trend found"}); }
     PriceTrend.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0,message:"Price trend updated successfully."});
      });
    });
};

// Deletes a auction from the DB.
exports.destroy = function(req, res) {
  PriceTrend.findById(req.params.id, function (err, pt) {
    if(err) { return handleError(res, err); }
    if(!pt) { return res.status(404).send('Not Found'); }
    pt.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(201).json({message:"Price trend deleted successfully."});;
    });
  });
};


exports.saveSurvey = function(req,res){
  PriceTrendSurvey.create(req.body, function(err, newTrendSurvey) {
      if(err) { return handleError(res, err); }
       return res.status(200).json({errorCode:0,message:"Price trend survey saved sucessfully"});
  });
}

exports.surveyAnalytics = function(req,res){

    var filter = {};

    if(req.body.productId)
      filter['product._id'] = req.body.productId;

    if(req.body.priceTrendId)
      filter['priceTrend._id'] = req.body.priceTrendId;
    
    PriceTrendSurvey.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$agree', count: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}

exports.getSurveyOnFilter = function(req,res){
  
  var filter = {};
  var orFilter = [];
  
  if(req.body.searchStr){
     var term = new RegExp(req.body.searchStr, 'i');
     orFilter[orFilter.length] = {"product.category":{$regex:term}};
     orFilter[orFilter.length] = {"product.brand":{$regex:term}};
     orFilter[orFilter.length] = {"product.model":{$regex:term}};
     orFilter[orFilter.length] = {"product.mfgYear":{$regex:term}};
     orFilter[orFilter.length] = {"priceTrend.saleYear":{$regex:term}};
     orFilter[orFilter.length] = {"user.fname":{$regex:term}};
     orFilter[orFilter.length] = {"user.lname":{$regex:term}};
     orFilter[orFilter.length] = {agree:{$regex:term}};
     orFilter[orFilter.length] = {comment:{$regex:term}};
  }

  if(orFilter.length > 0){
    filter['$or'] = orFilter;
  }

  if(req.body.productId)
    filter['product._id'] = req.body.productId;
  if(req.body.priceTrendId)
    filter['priceTrend._id'] = req.body.priceTrendId;
  if(req.body.agree)
    filter['agree'] = req.body.agree;

  if(req.body.pagination){
    Utility.paginatedResult(req,res,PriceTrendSurvey,filter,{});
    return;
  }

  PriceTrendSurvey.find(filter,function(err,result){
   if(err) { return handleError(res, err); }
    return res.status(200).json(result);
  })
}

function handleError(res, err) {
  return res.status(500).send(err);
}