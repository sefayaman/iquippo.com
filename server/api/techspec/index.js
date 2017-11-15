'use strict';

var express = require('express');
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

module.exports = router;
