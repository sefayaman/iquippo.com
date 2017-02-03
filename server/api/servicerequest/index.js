'use strict';

var express = require('express');
var controller = require('./servicerequest.controller');

var router = express.Router();

router.post('/', controller.create);
router.post('/getservices', controller.getService);
router.post('/export', controller.exportData);

module.exports = router;