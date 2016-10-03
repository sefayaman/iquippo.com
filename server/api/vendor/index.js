'use strict';

var express = require('express');
var controller = require('./vendor.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/validate', controller.validate);
//router.post('/validatevendor', controller.validateVendor);
//router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;