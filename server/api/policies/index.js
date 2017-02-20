'use strict';

var express = require('express');
var controller = require('./policies.controller');

var router = express.Router();


router.post('/', controller.update);

router.get('/getData',controller.getData);

module.exports = router;