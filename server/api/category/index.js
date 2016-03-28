'use strict';

var express = require('express');
var controller = require('./category.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/saveCategory', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/search', controller.search);

module.exports = router;