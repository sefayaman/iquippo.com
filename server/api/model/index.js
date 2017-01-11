'use strict';

var express = require('express');
var controller = require('./model.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/saveModel', controller.create);
router.post('/search', controller.getModelOnFilter);

module.exports = router;