'use strict';

var express = require('express');
var controller = require('./message.controller');

var router = express.Router();

router.get('/:emailid', controller.getusersmails);
router.post('/create', controller.create);
router.post('/insertreply/:messid', controller.insertreply);

module.exports = router;