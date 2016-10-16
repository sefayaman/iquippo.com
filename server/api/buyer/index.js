'use strict';

var express = require('express');
var controller = require('./buyer.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
//router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/search', controller.search);
router.post('/buynow', controller.buyNow);
router.post('/onfilter', controller.getOnFilter);


module.exports = router;
