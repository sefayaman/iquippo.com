'use strict';

var express = require('express');
var controller = require('./productquote.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.post('/getadditionalservice', controller.getAdditionalService);
router.post('/onfilter', controller.getOnFilter);
router.post('/export', controller.exportAdditionalSvc);
module.exports = router;