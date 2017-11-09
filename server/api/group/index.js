'use strict';

var express = require('express');
var controller = require('./group.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.get,controller.categoryCount);
router.get('/:id', controller.getOnId);
router.post('/saveGroup',auth.hasRole('admin'),controller.create);

module.exports = router;