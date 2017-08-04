'use strict';

var express = require('express');
var controller = require('./product.controller');
var scriptController=require('./scripts');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);

router.get('/unique/assetId',controller.updateAssetId);
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
//will deprecate this api and will inport using only v1 api
router.post('/import', controller.importProducts);
router.post('/bulkproductstatusupdate', controller.bulkProductStatusUpdate);
router.post('/bulkupdate', controller.bulkUpdate);
router.post('/userwiseproductcount', controller.userWiseProductCount);
router.post('/updateinquiry', controller.updateInquiryCounter);
router.post('/categorywisecount', controller.categoryWiseCount);
router.post('/incomingproducts', controller.incomingProduct);
router.post('/deleteincomingproduct', controller.deleteIncomingProduct);
router.post('/incomingproduct', controller.getIncomingProduct);
router.post('/unlockincomingproduct', controller.unIncomingProduct);
router.post('/statuswisecount', controller.statusWiseCount);
router.post('/createauction', controller.createOrUpdateAuction);

router.post('/bulkeditproduct',controller.parseExcel,controller.validateExcelData,controller.updateExcelData);
router.get('/script/featured',scriptController.script);
//v1 version of bulk create product
router.post('/v1/import',controller.parseImportExcel,controller.validateExcelData,controller.createProductReq);

router.get('/script/modifyproducttype',scriptController.modifyProductTypeId);



module.exports = router;