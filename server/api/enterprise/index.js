'use strict';

var express = require('express');
var controller = require('./enterprise.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/onfilter', controller.getOnFilter);
//router.post('/export', controller.exportAuction);
//router.post('/upload/excel',controller.bulkUpload);

module.exports = router;
