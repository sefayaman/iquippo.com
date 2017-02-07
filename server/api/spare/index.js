'use strict';

var express = require('express');
var controller = require('./spare.controller');
var json2xls = require('json2xls');

var router = express.Router();

router.use(json2xls.middleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
//router.delete('/:id', controller.destroy);
router.post('/searchspare', controller.searchSpare);
router.post('/statuswisecount', controller.statusWiseCount);
router.get('/fetch/export.xlsx',controller.exportXLSX);


module.exports = router;