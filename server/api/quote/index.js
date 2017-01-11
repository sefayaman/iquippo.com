'use strict';

var express = require('express');
var controller = require('./quote.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.post('/onfilter', controller.getOnFilter);
router.post('/export', controller.exportQuickQuery);

module.exports = router;