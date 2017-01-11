'use strict';

var express = require('express');
var controller = require('./manpower.controller');
var json2xls = require('json2xls');

var router = express.Router();

router.use(json2xls.middleware);
router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/create', controller.create);
router.post('/getequipment',controller.getConcatCatSubCat);
router.post('/getmanpoweruserfilter', controller.getSearchedUser);
router.put('/update/:id', controller.update);
router.post('/statuswisecount', controller.statusWiseCount);
router.get('/data/fetch.xlsx',controller.renderXlsx);
module.exports = router;