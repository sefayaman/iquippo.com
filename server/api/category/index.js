'use strict';

var express = require('express');
var controller = require('./category.controller');

var router = express.Router();

router.get('/category', controller.getAllCategory);
router.post('/category/save', controller.createCategory);
router.put('/category/:id', controller.updateCategory);
router.post('/category/search', controller.searchCategory);

router.get('/subcategory', controller.getAllSubCategory);
router.post('/subcategory/save', controller.createSubCategory);
router.put('/subcategory/:id', controller.updateSubCategory);
router.delete('/subcategory/:id', controller.destroySubCategory);

module.exports = router;