'use strict';

var express = require('express');
var controller = require('./bulkorder.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/newbulkorder',controller.get);
router.post('/newbulkorder',auth.isAuthenticated(),controller.save);

module.exports = router;