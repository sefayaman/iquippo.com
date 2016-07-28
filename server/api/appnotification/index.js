'use strict';

var express = require('express');
var controller = require('./appnotification.controller');

var router = express.Router();

router.post('/create', controller.createNotification);
router.post('/update', controller.updateAppNotification);
router.post('/search', controller.search);

module.exports = router;