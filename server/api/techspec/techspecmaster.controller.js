'use strict';

var _ = require('lodash');
var Seq = require('seq');
var moment = require('moment');
var TechSpecMaster = require('./techspecmaster.model.js');
var Product = require('./../product/product.model.js');
var TechSpecValMaster = require('./techspecvalmaster.model.js');
var Utility = require('./../../components/utility.js');
var fieldsConfig = require('./fieldsConfig');

// Get list of all 
exports.get = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  if (queryParam.searchStr) {
       filter['$text'] = {
        '$search': "\""+queryParam.searchStr+"\""
      }
  }

 if (queryParam.categoryId)
    filter.categoryId = queryParam.categoryId;
  if (queryParam.brand)
    filter.brand = queryParam.brand;
  if (queryParam.model)
    filter.model = queryParam.model;
  

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, TechSpecMaster, filter, {});
    return;
  }

  var query = TechSpecMaster.find(filter);

  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    req.result = result;
    if(queryParam.type === 'excel'){
      renderTechspecMasterExcel(req,res);
    }
    return res.status(200).json(result);
  });
};

// Get list of all field data
exports.getFieldData = function(req, res) {
  var queryParam = req.query;
  var filter = {};
  if (queryParam.searchStr) {
    filter['$text'] = {
      '$search': "\""+queryParam.searchStr+"\""
    }
  }

  if (queryParam.categoryId)
    filter['category.categoryId'] = queryParam.categoryId + "";
  if (queryParam.brandId)
    filter['brand.brandId'] = queryParam.brandId + "";
  if (queryParam.modelId)
    filter['model.modelId'] = queryParam.modelId + "";

  if (queryParam.pagination) {
    Utility.paginatedResult(req, res, TechSpecValMaster, filter, {});
    return;
  }

  var query = TechSpecValMaster.find(filter).sort({createdAt: -1});
  
  query.exec(function(err, result) {
    if (err) {
      return handleError(res, err);
    }
    req.result = result;
    if(queryParam.type === 'excel'){
      renderTechspecMasterExcel(req,res);
    }
    return res.status(200).json(result);
  });
};

exports.create = function(req, res) {
  TechSpecMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Data saved sucessfully", data:respo});
  });
};
exports.createfield = function(req, res) {//console.log("req.body=",req.body);
  TechSpecValMaster.create(req.body, function(err, respo) {
    if(err) { return handleError(res, err); }
     return res.status(200).json({errorCode:0, message:"Data saved sucessfully", data:respo});
  });
};
//search based on filter
exports.getOnFilter = function(req, res) {
  var filter = {};
  if (req.query.searchStr) {
    filter['$text'] = {
      '$search': "\""+req.query.searchStr+"\""
    }
  }

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,TechSpecMaster,filter,{});
    return;    
  }
  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = TechSpecMaster.find(filter).sort(sortObj);
  Seq()
  .par(function(){
    var self = this;
    DealerMaster.count(filter,function(err, counts){
      result.totalItems = counts;
      self(err);
    })
  })
  .par(function(){
    var self = this;
    query.exec(function (err, fieldValue) {
        if(err) { return handleError(res, err); }
        result.inputReqs = fieldValue;
        self();
       }
    );

  })
  .seq(function(){
    return res.status(200).json(result.inputReqs);
  })
};

// Updates an existing input req in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  TechSpecMaster.findById(req.params.id, function (err, field) {
    if (err) { return handleError(res, err); }
    if(!field) { return res.status(404).send('Not Found'); }
    TechSpecMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};
exports.fieldUpdate = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  TechSpecValMaster.findById(req.params.id, function (err, fieldValue) {
    if (err) { return handleError(res, err); }
    if(!fieldValue) { return res.status(404).send('Not Found'); }
    TechSpecValMaster.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        updateProduct(req.body);
        return res.status(200).json({errorCode:0, message:"Request updated sucessfully"});
    });
  });
};

function updateProduct(techSpecData){
  var filter = {};
  filter['category._id'] = techSpecData.category.categoryId;
  filter['brand._id'] = techSpecData.brand.brandId;
  filter['model._id'] = techSpecData.model.modelId;
  filter.productCondition = 'new';
  var techSpecs = [];
  techSpecData.fields.forEach(function(item){
    if(item && item.isFront) {
      var dataObj = {};
      dataObj.name = item.name;
      dataObj.value = item.value;
      dataObj.priority = item.priority || 0;
      techSpecs[techSpecs.length] = dataObj;
    }
  });
  var dataToUpdate = {'techSpec' : techSpecs};
  Product.update(filter,{$set:dataToUpdate}).exec();
}

// Deletes a input req from the DB.
exports.delete = function(req, res) {
  TechSpecMaster.findById(req.params.id, function (err, field) {
    if(err) { return handleError(res, err); }
    if(!field) { return res.status(404).send('Not Found'); }
    field.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.fieldDelete = function(req, res) {
  TechSpecValMaster.findById(req.params.id, function (err, fieldValue) {
    if(err) { return handleError(res, err); }
    if(!fieldValue) { return res.status(404).send('Not Found'); }
    fieldValue.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};


exports.exportExcel = function(req,res){
  var queryParam = req.query;
   var filter = {};
  

  var dateFilter = {};
  switch(queryParam.type){
    case "techspec":

      var fieldMap = fieldsConfig["EXPORT_TECHSPEC_CATEGORY"];
      var query = TechSpecMaster.find(filter).sort({createdAt:-1});
      query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          exportExcel(req,res,fieldMap,dataArr);
      });
      break;
    case 'techspecbrand':

      var fieldMap = fieldsConfig["EXPORT_TECHSPEC_BRAND"];
      var query = TechSpecValMaster.find(filter).sort({createdAt:-1});
       query.exec(function(err,dataArr){
          if(err) { return handleError(res, err); }
          console.log('brand_______________',dataArr);
          exportExcel(req,res,fieldMap,dataArr);
      });
      break;
      default:
  }


  
  
};

function exportExcel(req,res,fieldMap,jsonArr){
  var queryParam = req.query;
  var role = queryParam.role;
  var headers = Object.keys(fieldMap);
  var allowedHeaders = [];
  for(var i=0;i < headers.length;i++){
      var hd = headers[i];
      var obj = fieldMap[hd];
      if(obj.allowedRoles && obj.allowedRoles.indexOf(role) == -1){
        continue;
      }
      allowedHeaders.push(hd);
  }
  var str = allowedHeaders.join(",");
  str += "\r\n";
  //dataArr.push(allowedHeaders);
  jsonArr.forEach(function(item,idx){
    //dataArr[idx + 1] = [];

    allowedHeaders.forEach(function(header){
      var keyObj = fieldMap[header];
      var val = _.get(item,keyObj.key,"");
      if(keyObj.type && keyObj.type == 'boolean')
          val = val?'YES':'NO';
      if(keyObj.type && keyObj.type == 'date' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY');
      if(keyObj.type && keyObj.type == 'datetime' && val)
        val = moment(val).utcOffset('+0530').format('MM/DD/YYYY HH:mm');
      if(keyObj.type && keyObj.type == 'url' && val){
        if(val.filename){
          if(val.external === true)
          val = val.filename;
          else
            val =  req.protocol + "://" + req.headers.host + "/download/"+ item.assetDir + "/" + val.filename || "";
        }else
          val = "";
        
      }
        val = val + "";
        if(val)
          val = val.replace(/,|\n/g, ' ') ;
        str += val + ",";
       //dataArr[idx + 1].push(val);
    });
    str += "\r\n";
  });

  str = str.substring(0,str.length -1);
  return  renderCsv(req,res,str);
}

function renderCsv(req,res,csv){
   var fileName = req.query.type + "_" + new Date().getTime();
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader("Content-Disposition", 'attachment; filename=' + fileName + '.csv;');
  res.end(csv, 'binary'); 
}

function handleError(res, err) {
  return res.status(500).send(err);
}
