'use strict';

var _ = require('lodash');
var Category = require('./category.model');

// Get list of category
exports.getAll = function(req, res) {
  /*var filter = {};
  filter["deleted"] = false;
  filter["status"] = true;*/
  Category.find(function (err, category) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(category);
  });
};

// Get a single category
exports.getOnId = function(req, res) {
  Category.findById(req.params.id, function (err, category) {
    if(err) { return handleError(res, err); }
    if(!category) { return res.status(404).send('Not Found'); }
    return res.json(category);
  });
};

// Creates a new category in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  //var Result=Group.findOne({name:req.body.name});
  var filter = {};
  filter["group.name"] =req.body.group.name;
  filter["name"] =req.body.name;
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
exports.update = function(req, res) {
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

exports.search = function(req, res) {
  var filter = {};
  filter["deleted"] = false;
  if(req.body.status)
    filter["status"] = req.body.status;
  
  var query = Category.find(filter);
  console.log(req.body.searchstr);
  query.exec(
               function (err, category) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(category);
               }
  );

};
// Deletes a category from the DB.
exports.destroy = function(req, res) {
  Category.findById(req.params.id, function (err, category) {
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