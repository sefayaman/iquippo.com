'use strict';

var express = require('express');
var controller = require('./category.controller');

var router = express.Router();

router.get('/category', controller.get,controller.productCount);
router.post('/category/save', controller.createCategory);
router.put('/category/:id', controller.updateCategory);
//router.post('/category/search', controller.get);

module.exports = router;