'use strict';

var express = require('express');
var controller = require('./cart.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.put('/:id', controller.update);
router.post('/', controller.create);
router.delete('/:id', controller.destroy);

module.exports = router;