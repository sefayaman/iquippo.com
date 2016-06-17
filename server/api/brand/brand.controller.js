'use strict';

var _ = require('lodash');
var Brand = require('./brand.model');

// Get list of brand
exports.getAll = function(req, res) {
  Brand.find(function (err, brands) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(brands);
  });
};

// Get a single brand
exports.getOnId = function(req, res) {
  Brand.findById(req.params.id, function (err, brand) {
    if(err) { return handleError(res, err); }
    if(!brand) { return res.status(404).send('Not Found'); }
    return res.json(brand);
  });
};

// Creates a new brand in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  //var Result=Group.findOne({name:req.body.name});
  var filter = {};
  filter["group.name"] =req.body.group.name;
  filter["category.name"] =req.body.category.name;
  filter["name"] =req.body.name;
  Brand.find(filter,function (err, brands) {
    if(err) { return handleError(res, err); }
    else
    {
    	if(brands.length>0)
    	{
    		return res.status(201).json({message:"Brand already exits!!!"});
    	}
        else{
        	Brand.create(req.body, function(err, brand) {
              if(err) { return handleError(res, err); }
               return res.status(200).json({message:"Brand save sucessfully"});
             });
        }  
    
    }
    
  });
};

exports.getBrandOnFilter = function(req,res){
  var data = req.body;
  var tempFilter = {};
  var filter = {};
  filter['$or'] = [{name:'Other'}];
   if(data.brandId)
    tempFilter['_id'] = data.brandId;
  
  if(data.categoryId)
    tempFilter['category._id'] = data.categoryId;
  if(data.categoryName)
    tempFilter['category.name'] = data.categoryName;
  filter['$or'].push(tempFilter);
  console.log("vvv",filter);
  Brand.find(filter,function(err,result){
   if(err) { return handleError(res, err); }
    return res.status(200).json(result);

  })
}

function handleError(res, err) {
  return res.status(500).send(err);
}