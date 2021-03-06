'use strict';

var express = require('express');
var controller = require('./valuation.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update, controller.submitRequest);
//router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/onfilter', controller.getOnFilter);
router.post('/export', controller.exportValuation);
//router.post('/createinvoice',auth.hasRole('admin'),controller.createInvoice);
//router.post('/updateinvoice',auth.hasRole('admin'),controller.updateInvoice);
//router.post('/generateinvoice',auth.hasRole('admin'),controller.generateInvoice);
router.post('/cancel',auth.isAuthenticated(),controller.findAndValidateRequest,controller.cancelRequest);
router.get('/generateinvoice/:ivNo',controller.generateInvoice);

router.post('/submitrequest',auth.isAuthenticated(),controller.submitRequest);
router.post('/iqvl/retailupdate',controller.updateFromAgency);
router.post('/removeonhold',auth.hasRole('admin'),controller.resumeRequest);
module.exports = router;
