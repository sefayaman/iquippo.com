'use strict';

var express = require('express');
var controller = require('./callback.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);

module.exports = router;