'use strict';

var _ = require('lodash');
var Category = require('./category.model');
var Product = require('./../product/product.model');

// Get list of category
exports.get = function(req, res,next) {

  var queryData = req.query;
  var filter = {};
  filter["deleted"] = false;
  if(queryData.status)
    filter["status"] = queryData.status;
  if(queryData.groupId)
    filter['group._id'] = queryData.groupId;
  if(queryData.group)
    filter['group.name'] = queryData.group;
  if(queryData.isForNew)
    filter['isForNew'] = true;
  if(queryData.isForUsed)
    filter['isForUsed'] = true;
  if(queryData.visibleOnUsed)
    filter['visibleOnUsed'] = true;
   if(queryData.visibleOnNew)
    filter['visibleOnNew'] = true;
  if(queryData.searchStr){
    var term = new RegExp(queryData.searchStr, 'i');
    filter['name'] = { $regex: term };
  }
  var query = Category.find(filter);
  query.exec(
       function (err, category) {
              if(err) { return handleError(res, err); }
              res.setHeader('Cache-Control', 'private, max-age=2592000');
              if(queryData.productCount && category.length){
                req.categories = category;
                return next();
              }else
                return res.status(200).json(category);
       }
  );
};

exports.productCount = function(req,res){
    var filter = {};
    filter['deleted'] = false;
    filter['status'] = true;
    var categoryIds = [];
    req.categories.forEach(function(item){
        categoryIds.push(item._id + "");
    });
    filter['category._id'] = {$in:categoryIds};
    if(req.query.isForUsed)
      filter['productCondition'] = "used";
    if(req.query.isForNew)
      filter['productCondition'] = "new";
    Product.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$category.name', count: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(res, err);
      var resultArr = [];
      req.categories.forEach(function(cat){
        cat = cat.toObject();
        resultArr.push(cat);
        result.forEach(function(item){
          if(cat.name + "" === item._id)
              cat.count = item.count;
        });
        if(!cat.count)
          cat.count = 0;
      });
      resultArr.sort(function(a,b){
          return b.count - a.count;
      });
      return res.status(200).json(resultArr);
    }
  );
}

exports.count = function(req,res){
  var queryData = req.query;
  var filter = {};
  filter["deleted"] = false;
  if(queryData.status)
    filter["status"] = queryData.status;
  if(queryData.groupId)
    filter['group._id'] = queryData.groupId;
  if(queryData.isForNew)
    filter['isForNew'] = true;
  if(queryData.isForUsed)
    filter['isForUsed'] = true;
   var query = Category.find(filter).count();
  query.exec(
       function (err, categoryCount) {
          if(err) { return handleError(res, err); }
          res.setHeader('Cache-Control', 'private, max-age=2592000');
          return res.status(200).json(categoryCount);
       }
  );
}

// Creates a new category in the DB.
exports.createCategory = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  var filter = {};
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
  if(req.body._id){
     filter['_id'] = req.body._id;
  }
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

function handleError(res, err) {
  return res.status(500).send(err);
}