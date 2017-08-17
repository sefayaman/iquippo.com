'use strict';

var _ = require('lodash');
var Category = require('./category.model');
var SubCategory = require('./subcategory.model');

// Get list of category
exports.getAllCategory = function(req, res) {
  /*var filter = {};
  filter["deleted"] = false;
  filter["status"] = true;*/
  Category.find().sort({'name':1}).exec(function (err, category) {
    if(err) { return handleError(res, err); }
    res.setHeader('Cache-Control', 'private, max-age=2592000');
    return res.status(200).json(category);
  });
};


// Creates a new category in the DB.
exports.createCategory = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  //var Result=Group.findOne({name:req.body.name});
  var filter = {};
  filter["group.name"] = {$regex:new RegExp("^"+ req.body.group.name + "$", 'i')};
  filter["name"] = {$regex:new RegExp("^"+ req.body.name + "$", 'i')};
  Category.find(filter,function (err, categories) {
    if(err) { return handleError(res, err); }
    else
    {
    	if(categories.length>0)
    	{
    		return res.status(201).json({message:"Category already exits!!!"});
    	}
        else{
        	Category.create(req.body, function(err, category) {
              if(err) { return handleError(res, err); }
               return res.status(200).json({message:"Category save sucessfully"});
             });
        }  
    
    }
    
  });
  
};

// Updates an existing category in the DB.
exports.updateCategory = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  if(req.body.userInfo) { delete req.body.userInfo; }
  req.body.updatedAt = new Date();
  Category.findById(req.params.id, function (err, category) {
    if (err) { return handleError(res, err); }
    if(!category) { return res.status(404).send('Not Found'); }
    Category.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

exports.searchCategory = function(req, res) {
  var filter = {};
  filter["deleted"] = false;
  if(req.body.status)
    filter["status"] = req.body.status;
  if(req.body.groupId)
    filter['group._id'] = req.body.groupId;
  if(req.body.searchStr){
    var term = new RegExp(req.body.searchStr, 'i');
    filter['name'] = { $regex: term };
  }
  var query = Category.find(filter);
  query.exec(
       function (err, category) {
              if(err) { return handleError(res, err); }
              res.setHeader('Cache-Control', 'private, max-age=2592000');
              return res.status(200).json(category);
       }
  );

};


// Get list of sub category
exports.getAllSubCategory = function(req, res) {
  SubCategory.find(function (err, subcategory) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(subcategory);
  });
};


// Creates a new sub category in the DB.
exports.createSubCategory = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  var filter = {};
  filter["name"] =req.body.name;
  filter["category.name"] =req.body.category.name;
  SubCategory.find(filter,function (err, categories) {
    if(err) { return handleError(res, err); }
    else
    {
      if(categories.length > 0)
      {
        return res.status(201).json({errorCode:1, message:"SubCategory already exits!!!"});
      }
        else{
          SubCategory.create(req.body, function(err, category) {
              if(err) { return handleError(res, err); }
               return res.status(200).json({errorCode:0, message:"Sub Category saved sucessfully"});
             });
        }  
    
    }
    
  });
  
};

// Updates an existing category in the DB.
exports.updateSubCategory = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  SubCategory.findById(req.params.id, function (err, category) {
    if (err) { return handleError(res, err); }
    if(!category) { return res.status(404).send('Not Found'); }
    SubCategory.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Deletes a category from the DB.
exports.destroySubCategory = function(req, res) {
  SubCategory.findById(req.params.id, function (err, category) {
    if(err) { return handleError(res, err); }
    if(!category) { return res.status(404).send('Not Found'); }
    category.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}