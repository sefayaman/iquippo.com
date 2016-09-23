'use strict';

var express = require('express');
var controller = require('./manpower.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/create', controller.create);
//router.post('/validatesignup',controller.validateSignup);
router.post('/getequipment',controller.getProducts);
router.post('/getmanpoweruserfilter', controller.getSearchedUser);
router.put('/update/:id', controller.update);
//router.post('/export', controller.exportServices);

module.exports = router;