'use strict';

var express = require('express');
var controller = require('./brand.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/count', controller.count);
router.get('/:id', controller.getOnId);
router.post('/saveBrand',auth.hasRole('admin'),controller.create);
router.post('/search', controller.getBrandOnFilter);

module.exports = router;