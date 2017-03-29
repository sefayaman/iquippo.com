'use strict';

var _ = require('lodash');
var Group = require('./group.model');

// Get list of group
exports.getAll = function(req, res) {
  Group.find().sort({name:1}).exec(function (err, group) {
    if(err) { return handleError(res, err); }
    res.setHeader('Cache-Control', 'private, max-age=2592000');
    return res.status(200).json(group);
  });
};

// Get a single group
exports.getOnId = function(req, res) {
  Group.findById(req.params.id, function (err, group) {
    if(err) { return handleError(res, err); }
    if(!group) { return res.status(404).send('Not Found'); }
    return res.json(group);
  });
};

// Creates a new group in the DB.
exports.create = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  //var Result=Group.findOne({name:req.body.name});
  var filter = {};
  filter["name"] ={$regex:new RegExp("^"+ req.body.name + "$", 'i')};
  Group.find(filter,function (err, groups) {
    if(err) { return handleError(res, err); }
    else
    {
    	if(groups.length>0)
    	{
    		return res.status(201).json({message:"Group already exits!!!"});
    	}
        else{
        	Group.create(req.body, function(err, group) {
              if(err) { return handleError(res, err); }
              console.log(group._id);
               return res.status(200).json({message:"Group save sucessfully"});
             });
        }  
    
    }
    
  });
  
};
// Updates an existing Group in the DB.
exports.update = function(req, res) {
  //if(req.body._id) { delete req.body._id; }
  //if(req.body.userInfo) { delete req.body.userInfo; }

    var filter = {};
  filter["name"] =req.body.name;
  Group.find(filter,function (err, groups) {
    if(err) { return handleError(res, err); }
    else
    {
    	if(groups.length>0)
    	{
    		return res.status(201).json({message:"Group already exits!!!"});
    	}
        else{
        	req.body.updatedAt = new Date();
  				Group.findById(req.body._id, function (err, group) {
    				if (err) { return handleError(res, err); }
    			if(!group) { return res.status(404).send('Group Not Found'); }
    			Group.update({_id:req.body._id},{$set:{name:req.body.name}},function(err){
        			if (err) { return handleError(res, err); }
        			return res.status(200).json({message:"Group update sucessfully!!!"});
    			});
  			});
        }  
    
    }
    
  });

  
};

// Deletes a Group from the DB.
exports.destroy = function(req, res) {
  Product.findById(req.body._id, function (err, group) {
    if(err) { return handleError(res, err); }
    if(!group) { return res.status(404).send('Group Not Found'); }
    group.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send({message:"Group deleted sucessfully!!!"});
    });
  });
};
function handleError(res, err) {
  return res.status(500).send(err);
}