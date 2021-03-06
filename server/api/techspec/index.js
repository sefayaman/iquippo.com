'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./techspecmaster.controller');

var router = express.Router();

router.get('/', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/onfilter', controller.getOnFilter);
router.post('/field', controller.createfield);
router.get('/fielddata', controller.getFieldData);
router.put('/fieldupdate/:id', controller.fieldUpdate);
router.delete('/fieldvalue/:id', controller.fieldDelete);
router.delete('/fieldvalue/:id', controller.fieldDelete);
router.get('/export',auth.hasRole('admin'),controller.exportExcel);
//router.get('/groupbydata', controller.getGroupByData);
module.exports = router;
