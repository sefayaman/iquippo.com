'use strict';

var _ = require('lodash');
var Cart = require('./cart.model');
var Product = require('./../product/product.model');

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
  var ids = [];
  cart.products.forEach(function(item){
    ids[ids.length] = item._id;    
  });
  var filter = {};
  filter['deleted'] = false;
  filter['status'] = true;
  filter['_id'] = {$in:ids};
  Product.find(filter,function(err,products){
    if(!err)
      cart.products = products;
    return res.json(cart);
  });
}

// Creates a new cart in the DB.
exports.create = function(req, res) {
  console.log("cart created");
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