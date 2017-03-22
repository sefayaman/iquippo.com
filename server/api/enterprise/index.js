'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./enterprise.controller');

var router = express.Router();

router.get('/', controller.get);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/upload/excel',controller.bulkUpload);
router.put('/upload/excel',controller.bulkModify);
router.post('/bulkUpdate',controller.bulkUpdate);
router.post('/createinvoice',auth.hasRole('admin'),controller.createInvoice);
router.post('/updateinvoice',auth.hasRole('admin'),controller.updateInvoice);
router.get('/generateinvoice/:invoiceNo',auth.hasRole('admin'),controller.generateInvoice);


module.exports = router;
