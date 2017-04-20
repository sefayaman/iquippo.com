'use strict';

var _ = require('lodash');
var Cart = require('./cart.model');
var Product = require('./../product/product.model');
var Spare = require('./../spare/spare.model');
var Seq = require('seq');

// Get list of buyer
exports.getAll = function(req, res) {
  Cart.find(function (err, buyer) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(buyer);
  });
};

// Get a cart for single user buyer
exports.getOnId = function(req, res) {
  Cart.findOne({'user._id':req.params.id}, function (err, cart){
    if(err) { return handleError(res, err); }
    if(!cart) { return res.status(404).send('Not Found'); }

    addNoCacheHeader(res);
    updateCartProduct(cart,res);
    //return res.json(cart);
  });
};

function updateCartProduct(cart,res){
  var prdIds = [];
  var sparesIds = [];
  cart.products.forEach(function(item){
    if(item.type == "spare")
        sparesIds[sparesIds.length] = item._id;
    else
      prdIds[prdIds.length] = item._id;
  });
  cart.products = [];
  Seq()
  .seq(function(){
       var self = this;
      if(prdIds.length == 0){
        self();
        return;
      }
      var filter = {};
      filter['deleted'] = false;
      filter['status'] = true;
      filter['_id'] = {$in:prdIds};
      Product.find(filter,function(err,products){
        if(!err){
          products.forEach(function(itm){
              var prdObj = {};
              prdObj.type = "equipment";
              prdObj._id = itm._id;
              prdObj.assetDir = itm.assetDir;
              prdObj.name = itm.name;
              prdObj.primaryImg = itm.primaryImg
              prdObj.condition = itm.productCondition;
              cart.products[cart.products.length] = prdObj;  
          })
          
        }
        self();
      });
  })
  .seq(function(){
    var self = this;
    if(sparesIds.length == 0){
       return res.json(cart);
      }
      var filter = {};
      filter['deleted'] = false;
      filter['status'] = "active";
      filter['_id'] = {$in:sparesIds};
      Spare.find(filter,function(err,spares){
        if(!err){
          spares.forEach(function(itm){
              var prdObj = {};
              prdObj.type = "spare";
              prdObj._id = itm._id;
              prdObj.assetDir = itm.assetDir;
              prdObj.name = itm.name;
              prdObj.primaryImg = itm.primaryImg
              prdObj.condition = itm.productCondition;
              cart.products[cart.products.length] = prdObj;  
          })
          
        }
        return res.json(cart);
      });

  });
  
}

// Creates a new cart in the DB.
exports.create = function(req, res) {
  Cart.create(req.body, function(err, buyer) {
    if(err) { return handleError(res, err); }
    addNoCacheHeader(res);
    return res.status(201).json(buyer);
  });
};

// Updates an existing cart in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  Cart.findById(req.params.id, function (err, cart) {
    if (err) { return handleError(res, err); }
    if(!cart) { return res.status(404).send('Not Found'); }
    Cart.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
    });
  });
};

// Deletes a product from cart from the DB.
exports.destroy = function(req, res) {
  Cart.findById(req.params.id, function (err, cart) {
    if(err) { return handleError(res, err); }
    if(!cart) { return res.status(404).send('Not Found'); }
    buyer.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

function addNoCacheHeader(res) {
   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
   res.header('Expires', '-1');
   res.header('Pragma', 'no-cache');
}