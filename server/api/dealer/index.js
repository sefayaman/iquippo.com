'use strict';

var express = require('express');
var controller = require('./dealermaster.controller');

var router = express.Router();

router.get('/', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/onfilter', controller.getOnFilter);

module.exports = router;
