'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./common.controller');
var valuationPurposeCtrl = require('./valuationpurpose.controller');
var servicefeeCtrl = require('./servicefee.controller');
var servicetaxCtrl = require('./servicetax.controller');
var vattaxCtrl = require('./vattax.controller');
var countCtrl = require('./count.controller');
var emdCtrl = require('./emd.controller');
var lotCtrl = require('./lot.controller');
var financeIntegrationCtrl = require('./financeintegration.controller');
var kycCtrl = require('./kycmaster.controller');
var enterpriseCtrl = require('./enterprisemaster.controller');
var markupPriceCtrl = require('./markupprice.controller');
var assetSaleChargeCtrl = require('./assetsalecharge.controller');
var apiCtrl=require('./api.controller');	
var bulkUploadCtrl = require('./uploadrequest/uploadrequest.controller');
var json2xls = require('json2xls');
var router = express.Router();

router.use(json2xls.middleware);

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

router.get('/country', controller.getAllCountry);
router.post('/country', controller.createCountry);
router.put('/country/:id', controller.updateCountry);
router.delete('/country/:id', controller.deleteCountry);

router.get('/city', controller.getAllCity);
router.post('/city', controller.createCity);
router.put('/city/:id', controller.updateCity);
router.delete('/city/:id', controller.deleteCity);
router.post('/city/search', controller.searchCity);
router.post('/location/search', controller.searchLocation);
router.post('/state/search', controller.searchState);
router.post('/assetId/search',controller.searchAssetId);

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
router.post('/importLocation',controller.importLocation);

router.get('/valuationpurpose', valuationPurposeCtrl.get);
router.post('/valuationpurpose', valuationPurposeCtrl.create);
router.put('/valuationpurpose/:id', valuationPurposeCtrl.update);
router.delete('/valuationpurpose/:id', valuationPurposeCtrl.destroy);

router.get('/servicefee', servicefeeCtrl.get);
router.post('/servicefee', servicefeeCtrl.create);
router.put('/servicefee/:id', servicefeeCtrl.update);
router.delete('/servicefee/:id', servicefeeCtrl.destroy);

router.get('/servicetax', servicetaxCtrl.get);
router.post('/servicetax', servicetaxCtrl.create);
router.put('/servicetax/:id', servicetaxCtrl.update);
router.delete('/servicetax/:id', servicetaxCtrl.destroy);

router.get('/vattax',auth.hasRole('admin'), vattaxCtrl.get);
router.post('/vattax', auth.hasRole('admin'),vattaxCtrl.create);
router.put('/vattax/:id', auth.hasRole('admin'),vattaxCtrl.update);
router.delete('/vattax/:id',auth.hasRole('admin'), vattaxCtrl.destroy);
router.post('/vattax/search',vattaxCtrl.search);

router.get('/kyc',auth.hasRole('admin'), kycCtrl.get);
router.post('/kyc', auth.hasRole('admin'),kycCtrl.create);
router.put('/kyc/:id', auth.hasRole('admin'),kycCtrl.update);
router.delete('/kyc/:id',auth.hasRole('admin'), kycCtrl.destroy);
router.post('/kyc/search',kycCtrl.search);

router.get('/enterprise',auth.hasRole('admin'), enterpriseCtrl.get);
router.post('/enterprise', auth.hasRole('admin'),enterpriseCtrl.create);
router.put('/enterprise/:id', auth.hasRole('admin'),enterpriseCtrl.update);
router.delete('/enterprise/:id',auth.hasRole('admin'), enterpriseCtrl.destroy);
router.post('/enterprise/search',enterpriseCtrl.search);

router.get('/markupprice',auth.hasRole('admin'), markupPriceCtrl.get);
router.post('/markupprice', auth.hasRole('admin'),markupPriceCtrl.create);
router.put('/markupprice/:id', auth.hasRole('admin'),markupPriceCtrl.update);
router.delete('/markupprice/:id',auth.hasRole('admin'), markupPriceCtrl.destroy);
router.post('/markupprice/search',markupPriceCtrl.search);

router.get('/assetsalecharge',auth.hasRole('admin'), assetSaleChargeCtrl.get);
router.post('/assetsalecharge', auth.hasRole('admin'),assetSaleChargeCtrl.create);
router.put('/assetsalecharge/:id', auth.hasRole('admin'),assetSaleChargeCtrl.update);
router.delete('/assetsalecharge/:id',auth.hasRole('admin'), assetSaleChargeCtrl.destroy);
router.post('/assetsalecharge/search',assetSaleChargeCtrl.search);
//render excel
router.get('/render.xlsx',controller.renderXLSX);
router.get('/redirecttorapid',financeIntegrationCtrl.setCustomerData);

router.post('/zip/reports',apiCtrl.uploadZip);
 
//Bulk Upload Routes
router.get('/bulkupload/request/fetch',bulkUploadCtrl.fetch,bulkUploadCtrl.renderJson);
router.post('/bulkupload/request/delete',bulkUploadCtrl.delete);

//counts on dashboard//
router.post('/assetlisted', auth.hasRole('admin'),countCtrl.create);
router.get('/assetlisted',countCtrl.getAssetCount);
router.put('/assetlisted/:id', auth.hasRole('admin'),countCtrl.updateAssetListed);
router.post('/emd', auth.hasRole('admin'),emdCtrl.create);
router.get('/emd',emdCtrl.getEmdData);
router.put('/emd/:id', auth.hasRole('admin'),emdCtrl.updateEmdData);
router.delete('/emd/:id',auth.hasRole('admin'), emdCtrl.destroy);
router.get('/lot',lotCtrl.getLotData);
router.delete('/lot/:id',auth.hasRole('admin'), lotCtrl.destroy);
router.post('/lot', auth.hasRole('admin'),lotCtrl.create);
router.put('/lot/:id', auth.hasRole('admin'),lotCtrl.updateLotData);
module.exports = router;