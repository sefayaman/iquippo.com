'use strict';

var express = require('express');
var controller = require('./spare.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
//router.delete('/:id', controller.destroy);
router.post('/searchspare', controller.searchSpare);
router.post('/statuswisecount', controller.statusWiseCount);

module.exports = router;