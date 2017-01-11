'use strict';

var express = require('express');
var controller = require('./services.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.post('/getservices', controller.getService);
router.post('/export', controller.exportServices);

module.exports = router;