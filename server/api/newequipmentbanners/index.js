'use strict';

var express = require('express');
var controller = require('./newEquipmentBanners.controller');

var router = express.Router();

router.get('/', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/onfilter', controller.getOnFilter);
router.get('/check', controller.check);

module.exports = router;
