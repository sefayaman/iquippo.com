'use strict';

var express = require('express');
var controller = require('./product.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/setexpiry', controller.setExpiry);
//router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/search', controller.search);
router.post('/countrywiseCount', controller.countryWiseProductCount);
router.post('/gethistory', controller.getHistory);
router.post('/createhistory', controller.createHistory);
router.post('/export', controller.exportProducts);
router.post('/import', controller.importProducts);


module.exports = router;