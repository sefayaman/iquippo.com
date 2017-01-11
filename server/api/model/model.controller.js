'use strict';

var _ = require('lodash');
var Model = require('./model.model');

// Get list of model
exports.getAll = function(req, res) {
  Model.find(function (err, model) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(model);
  });
};

// Get a single model
exports.getOnId = function(req, res) {
  Model.findById(req.params.id, function (err, model) {
    if(err) { return handleError(res, err); }
    if(!model) { return res.status(404).send('Not Found'); }
    return res.status(200).json(model);
  });
};

// Creates a new model in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  //var Result=Group.findOne({name:req.body.name});
  var filter = {};
  filter["group.name"] = {$regex:new RegExp("^"+ req.body.group.name + "$", 'i')};
  filter["category.name"] = {$regex:new RegExp("^"+ req.body.category.name + "$", 'i')};
  filter["brand.name"] = {$regex:new RegExp("^"+ req.body.brand.name + "$", 'i')};
  filter["name"] = {$regex:new RegExp("^"+ req.body.name + "$", 'i')};
  Model.find(filter,function (err, models) {
    if(err) { return handleError(res, err); }
    else
    {
    	if(models.length>0)
    	{
    		return res.status(201).json({message:"Model already exits!!!"});
    	}
        else{
        	Model.create(req.body, function(err, model) {
              if(err) { return handleError(res, err); }
               return res.status(200).json({message:"Model save sucessfully"});
             });
        }  
    
    }
    
  });
};

exports.getModelOnFilter = function(req,res){
  var data = req.body;
 var tempFilter = {};
  var filter = {};
  filter['$or'] = [{name:'Other'}];
  if(data.modelId)
    tempFilter['_id'] = data.modelId;
  if(data.brandId)
    tempFilter['brand._id'] = data.brandId;
  if(data.brandName)
    tempFilter['brand.name'] = data.brandName;
  filter['$or'].push(tempFilter);
  Model.find(filter,function(err,result){
   if(err) { return handleError(res, err); }
    return res.status(200).json(result);

  })
}

function handleError(res, err) {
  return res.status(500).send(err);
}