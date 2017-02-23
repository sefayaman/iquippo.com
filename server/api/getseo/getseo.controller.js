'use strict';

var Model= require('./getseo.model');

exports.save = function(req, res) {
  req.body.createdAt = new Date();
  req.body.updatedAt = req.body.createdAt;
  //var Result=Group.findOne({name:req.body.name});
  Model.create(req.body,function (err, data) {
    if(err) { return res.status(500); }
    return res.status(200).json({message:"Data saved sucessfully"});
  });
  
};

exports.get = function(req, res) {
  var filter ={categoryId : req.body.categoryId};

  Model.find(filter).exec(function (err, data) {
    if(err) { return res.status(204); }
    return res.status(200).json(data);
  });
};

exports.update = function(req, res) {
    var upObj={};
    var filter = {};
  filter["categoryId"] =req.body.categoryId;
  if(req.body.title){
    upObj.title=req.body.title;
  }
  if(req.body.meta){
   upObj.meta=req.body.meta; 
  }
  Model.update(filter,{$set:upObj},function (err, data) {
    if(err) { return res.status(500); }
    
        return res.status(200).json({message:"sucessfully updated"});
  });

  
};
