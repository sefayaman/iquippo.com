'use strict';

var express = require('express');
var controller = require('./common.controller');

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

router.get('/auctionmaster', controller.getAuctionMaster);
router.post('/auctionmaster', controller.importAuctionMaster);
router.delete('/auctionmaster/:id', controller.deleteAuctionMaster);


module.exports = router;