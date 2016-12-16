'use strict';

var express = require('express');
var controller = require('./reports.controller');
var json2xls = require('json2xls');

var router = express.Router();

router.get('/fetch.json', controller.fetch, controller.renderJson);
router.use(json2xls.middleware);
router.get('/fetch.csv', controller.fetch, controller.renderCsv);
router.get('/fetch.count.json', controller.count);


module.exports = router;