'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./enterprise.controller');
var assetGroupCtrl = require('./assetgroup.controller');
var scriptController=require('./scripts');

var router = express.Router();

router.get('/script/phChange',scriptController.script);
router.get('/', auth.isAuthenticated(),controller.get);
router.get('/export',auth.isAuthenticated(),controller.exportExcel);
router.get('/:id',auth.isAuthenticated(),controller.getOnId);
router.post('/',auth.isAuthenticated(),controller.create);
router.post('/cancel',auth.isAuthenticated(),controller.cancelRequest);
router.post('/removeonhold',auth.isAuthenticated(),controller.resumeRequest);
router.post('/submitrequest',auth.isAuthenticated(),controller.submitRequest);
router.put('/:id',auth.isAuthenticated(),controller.validateUpdate,controller.update);
router.post('/upload/excel',auth.isAuthenticated(),controller.bulkUpload);
router.put('/upload/excel',auth.isAuthenticated(),controller.bulkModify);
router.post('/bulkUpdate',auth.isAuthenticated(),controller.bulkUpdate);
router.post('/createinvoice',auth.hasRole('admin'),controller.createInvoice);
router.post('/updateinvoice',auth.hasRole('admin'),controller.updateInvoice);
router.get('/generateinvoice/:invoiceNo',auth.hasRole('admin'),controller.generateInvoice);
router.post('/iqvl/update',controller.updateFromAgency);
/*
* This route should be commented once user are remapped to currect enterpriser  
*/

router.post('/userremapping',scriptController.userRemapping);
router.post('/updaterequest',scriptController.updateLegalEntityInRequest);


/*
* Asset Group Master Routes
*/
router.post('/asset/group',auth.hasRole('admin'),assetGroupCtrl.create);
router.put('/asset/group/:id', auth.hasRole('admin'), assetGroupCtrl.update);
router.get('/asset/group',assetGroupCtrl.fetch,assetGroupCtrl.renderJson);

router.get('/asset/group/count',auth.hasRole('admin'),assetGroupCtrl.count);
router.post('/asset/group/upload/excel',auth.hasRole('admin'),assetGroupCtrl.uploadExcel);
router.delete('/asset/group/:id',auth.hasRole('admin'),assetGroupCtrl.delete);

//router.put('/asset/group/upload/excel',auth.hasRole('admin'),assetGroupCtrl.modifyExcel);


module.exports = router;
