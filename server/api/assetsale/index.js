'use strict';

var express = require('express');
var controller = require('./assetsale.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/update', controller.updateAppNotification);
router.post('/search', controller.search);

module.exports = router;