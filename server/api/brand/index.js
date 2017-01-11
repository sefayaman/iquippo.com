'use strict';

var express = require('express');
var controller = require('./brand.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/saveBrand', controller.create);
router.post('/search', controller.getBrandOnFilter);

module.exports = router;