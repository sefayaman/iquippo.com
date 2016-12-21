'use strict';

var express = require('express');
var controller = require('./common.controller');
var bulkUploadCtrl = require('./uploadrequest/uploadrequest.controller');

var router = express.Router();

router.get('/countries', controller.getAllCountry);
router.post('/sendOtp', controller.sendOtp);
router.post('/notificationTemplate', controller.compileHtml);
router.post('/gethelp', controller.getHelp);
router.post('/buildsuggestion', controller.buildSuggestion);
router.post('/importMasterData', controller.importMasterData);
router.post('/exportMasterData', controller.exportMasterData);
router.post('/deleteMasterData', controller.deleteMasterData);
router.post('/updateMasterData', controller.updateMasterData);
router.post('/rotate', controller.rotate);
router.post('/saveasimage', controller.saveAsImage);
router.post('/upsertsetting', controller.upsertSetting);
router.post('/getsettingonkey', controller.getSettingByKey);

router.get('/state', controller.getAllState);
router.post('/state', controller.createState);
router.put('/state/:id', controller.updateState);
router.delete('/state/:id', controller.deleteState);

router.get('/city', controller.getAllCity);
router.post('/city', controller.createCity);
router.put('/city/:id', controller.updateCity);
router.delete('/city/:id', controller.deleteCity);
router.post('/city/search', controller.searchCity);
router.post('/location/search', controller.searchLocation);

router.get('/subscribe', controller.getAllSubscriber);
router.post('/subscribe', controller.createSubscribe);

router.get('/savesearch/:id', controller.getOnId);
router.post('/savesearch', controller.createSearch);
router.put('/savesearch/:id', controller.updateSaveSearch);
router.delete('/savesearch/:id', controller.deleteSaveSearch);

router.get('/paymentmaster', controller.getPaymentMaster);
router.post('/paymentmaster', controller.createPaymentMaster);
router.put('/paymentmaster/:id', controller.updatePaymentMaster);
router.delete('/paymentmaster/:id', controller.deletePaymentMaster);

router.get('/manufacturer', controller.getAllManufacturer);
router.post('/manufacturer/save', controller.createManufacturer);
router.put('/manufacturer/:id', controller.updateManufacturer);
router.delete('/manufacturer/:id', controller.destroyManufacturer);

router.get('/banner', controller.getAllBanner);
router.post('/banner', controller.createBanner);
router.put('/banner/:id', controller.updateBanner);
router.delete('/banner/:id', controller.deleteBanner);
router.post('/banner/onfilter', controller.getBannerOnFilter);


//Bulk Upload Routes
router.get('/bulkupload/request/fetch',bulkUploadCtrl.fetch,bulkUploadCtrl.renderJson);
router.post('/bulkupload/request/delete',bulkUploadCtrl.delete)

module.exports = router;