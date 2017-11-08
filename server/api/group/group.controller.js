'use strict';

var _ = require('lodash');
var Group = require('./group.model');
var Category = require('./../category/category.model');

// Get list of group
exports.get = function(req, res,next) {
  
  var filter = {};
  var queryData = req.query;
  if(queryData.isForUsed)
      filter['isForUsed'] = true;
  if(queryData.isForNew)
      filter['isForNew'] = true;
  if(queryData.visibleOnUsed)
      filter['visibleOnUsed'] = true;
  if(queryData.searchStr){
     var term = new RegExp(queryData.searchStr, 'i');
      filter['name'] = { $regex: term };
  }
  Group.find(filter).sort({name:1}).exec(function (err, group) {
    if(err) { return handleError(res, err); }
    res.setHeader('Cache-Control', 'private, max-age=2592000');
    if(queryData.categoryCount){
      req.groups = group;
      return next();
    }else
      return res.status(200).json(group);
  });

};

exports.categoryCount = function(req,res){
    if(!req.groups.length)
      return res.status(200).json(req.groups);
    var groupIds = [];
    var filter = {};
    req.groups.forEach(function(item){
      groupIds.push(item._id + "");      
    });
    filter['group._id'] = {$in:groupIds};
    Category.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$group._id', count: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(err);
      var resultArr = [];
      req.groups.forEach(function(group){
        group = group.toObject();
        resultArr.push(group);
        result.forEach(function(item){
          if(group._id + "" === item._id)
              group.count = item.count;
        });
        if(!group.count)
          group.count = 0;
      });
      resultArr.sort(function(a,b){
          return b.count - a.count;
      });
      return res.status(200).json(resultArr);
    }
  );
}

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
               return res.status(200).json({message:"Group save sucessfully"});
             });
        }  
    
    }
    
  });
  
};

function handleError(res, err) {
  return res.status(500).send(err);
}