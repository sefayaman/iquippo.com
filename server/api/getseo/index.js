'use strict';

var express = require('express');
var controller = require('./getseo.controller');

var router = express.Router();

router.post('/', controller.get);
router.post('/save', controller.save);
router.post('/update',controller.update);

module.exports = router;