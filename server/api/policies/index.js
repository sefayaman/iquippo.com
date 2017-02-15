'use strict';

var express = require('express');
var controller = require('./policies.controller');

var router = express.Router();


router.post('/', controller.update);

module.exports = router;