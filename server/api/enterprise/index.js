'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./enterprise.controller');
var assetGroupCtrl = require('./assetgroup.controller');

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


/*
* Asset Group Master Routes
*/
router.post('/asset/group',auth.hasRole('admin'),assetGroupCtrl.create);
router.get('/asset/group',auth.hasRole('admin'),assetGroupCtrl.fetch,assetGroupCtrl.renderJson);

router.get('/asset/group/count',auth.hasRole('admin'),assetGroupCtrl.count);
router.post('/asset/group/upload/excel',auth.hasRole('admin'),assetGroupCtrl.uploadExcel);
router.delete('/asset/group/:id',auth.hasRole('admin'),assetGroupCtrl.delete);

//router.put('/asset/group/upload/excel',auth.hasRole('admin'),assetGroupCtrl.modifyExcel);


module.exports = router;
