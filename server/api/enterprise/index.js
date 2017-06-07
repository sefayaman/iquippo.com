'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./enterprise.controller');
var assetGroupCtrl = require('./assetgroup.controller');
var scriptController=require('./scripts');

var router = express.Router();

router.get('/', controller.get);
router.get('/export', controller.exportExcel);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/upload/excel',controller.bulkUpload);
router.put('/upload/excel',controller.bulkModify);
router.post('/bulkUpdate',controller.bulkUpdate);
router.post('/createinvoice',auth.hasRole('admin'),controller.createInvoice);
router.post('/updateinvoice',auth.hasRole('admin'),controller.updateInvoice);
router.get('/generateinvoice/:invoiceNo',auth.hasRole('admin'),controller.generateInvoice);
router.post('/iqvl/update',controller.updateFromAgency);
/*
* This route should be commented once user are remapped to currect enterpriser  
*/

router.post('/userremapping',scriptController.userRemapping);


/*
* Asset Group Master Routes
*/
router.post('/asset/group',auth.hasRole('admin'),assetGroupCtrl.create);
router.put('/asset/group/:id', auth.hasRole('admin'), assetGroupCtrl.update);
router.get('/asset/group',auth.hasRole('admin'),assetGroupCtrl.fetch,assetGroupCtrl.renderJson);

router.get('/asset/group/count',auth.hasRole('admin'),assetGroupCtrl.count);
router.post('/asset/group/upload/excel',auth.hasRole('admin'),assetGroupCtrl.uploadExcel);
router.delete('/asset/group/:id',auth.hasRole('admin'),assetGroupCtrl.delete);
router.get('/script/phChange',scriptController.script);

//router.put('/asset/group/upload/excel',auth.hasRole('admin'),assetGroupCtrl.modifyExcel);


module.exports = router;
