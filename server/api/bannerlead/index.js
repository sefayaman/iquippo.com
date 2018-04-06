'use strict';

var express = require('express');
var controller = require('./bannerlead.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/',auth.hasRole('admin'),controller.get);
router.get('/export',auth.hasRole('admin'),controller.exportCsv);
router.post('/',controller.create);

module.exports = router;