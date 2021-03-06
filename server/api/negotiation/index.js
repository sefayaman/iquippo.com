'use strict';

var express = require('express');
var controller = require('./negotiation.controller');

var router = express.Router();


router.post('/', controller.create);
router.post('/search', controller.search);
router.post('/export', controller.exportData);

module.exports = router;