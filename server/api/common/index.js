'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./common.controller');
var bannerCtrl = require('./banner.controller');
var valuationPurposeCtrl = require('./valuationpurpose.controller');
var servicefeeCtrl = require('./servicefee.controller');
var servicetaxCtrl = require('./servicetax.controller');
var vattaxCtrl = require('./vattax.controller');
var countCtrl = require('./count.controller');
var emdCtrl = require('./emd.controller');
var lotCtrl = require('./lot.controller');
var offerCtrl = require('./offer.controller');
var financeIntegrationCtrl = require('./financeintegration.controller');
var kycCtrl = require('./kycmaster.controller');
var saleProcessCtrl = require('./saleprocessmaster.controller');
var markupPriceCtrl = require('./markupprice.controller');
var assetSaleChargeCtrl = require('./assetsalecharge.controller');
var emdChargeCtrl = require('./emdcharge.controller');
var apiCtrl = require('./api.controller');	
var bulkUploadCtrl = require('./uploadrequest/uploadrequest.controller');
var valuationCancellationCtrl = require('./valuationcancellationfee.controller');
var inputFormCtrl = require('./inputformmaster.controller');
var bookADemoCtrl = require('./bookademo.controller');
var legalEntityTypeCtrl = require('./legalentitytype.controller');
var bankMasterCtrl = require('./bankmaster.controller');
var IquippoGstMasterCtrl = require('./iquippogstmaster.controller');
var json2xls = require('json2xls');
var router = express.Router();

router.use(json2xls.middleware);

router.post('/sendOtp', controller.sendOtp);
router.post('/notificationTemplate', controller.compileHtml);
router.post('/gethelp', controller.getHelp);
router.post('/buildsuggestion', controller.buildSuggestion);
router.post('/importMasterData',auth.hasRole('admin'),controller.importMasterData);
router.post('/exportMasterData',auth.hasRole('admin'),controller.exportMasterData);
router.post('/deleteMasterData',auth.hasRole('admin'),controller.deleteMasterData);
router.post('/updateMasterData',auth.hasRole('admin'),controller.updateMasterData);
router.post('/updateMasterDataStatus',auth.hasRole('admin'),controller.updateMasterDataStatus);
router.post('/rotate', controller.downloadFromS3,controller.rotate,controller.uploadToS3);
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

router.get('/banner', bannerCtrl.get);
router.post('/banner', bannerCtrl.createBanner);
router.put('/banner/:id', bannerCtrl.updateBanner);
router.delete('/banner/:id', bannerCtrl.deleteBanner);
//router.post('/banner/onfilter', controller.getBannerOnFilter);
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
//router.get('/vattax/getgstonproduct',vattaxCtrl.getGstOnProduct);

router.get('/kyc',auth.hasRole('admin'), kycCtrl.get);
router.post('/kyc', auth.hasRole('admin'),kycCtrl.create);
router.put('/kyc/:id', auth.hasRole('admin'),kycCtrl.update);
router.delete('/kyc/:id',auth.hasRole('admin'), kycCtrl.destroy);
router.post('/kyc/search',kycCtrl.search);

router.get('/saleprocess',auth.hasRole('admin'), saleProcessCtrl.get);
router.post('/saleprocess', auth.hasRole('admin'),saleProcessCtrl.create);
router.put('/saleprocess/:id', auth.hasRole('admin'),saleProcessCtrl.update);
router.delete('/saleprocess/:id',auth.hasRole('admin'), saleProcessCtrl.destroy);
router.post('/saleprocess/search',saleProcessCtrl.search);

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

router.get('/emdcharge',auth.hasRole('admin'), emdChargeCtrl.get);
router.post('/emdcharge', auth.hasRole('admin'),emdChargeCtrl.create);
router.put('/emdcharge/:id', auth.hasRole('admin'),emdChargeCtrl.update);
router.delete('/emdcharge/:id',auth.hasRole('admin'), emdChargeCtrl.destroy);
router.post('/emdcharge/search',emdChargeCtrl.search);
//render excel
router.get('/render.xlsx',controller.renderXLSX);
router.get('/redirecttorapid',financeIntegrationCtrl.setCustomerData);

router.post('/zip/reports',apiCtrl.uploadZip);
 
//Bulk Upload Routes
router.get('/bulkupload/request/fetch',bulkUploadCtrl.fetch,bulkUploadCtrl.renderJson);
router.post('/bulkupload/request/delete',bulkUploadCtrl.delete);

//counts on dashboard//
router.put('/removelotdata/:id', auth.hasRole('admin'),lotCtrl.removeLotData);
router.post('/assetlisted', auth.hasRole('admin'),countCtrl.create);
router.get('/assetlisted',countCtrl.getAssetCount);
router.put('/assetlisted/:id', auth.hasRole('admin'),countCtrl.updateAssetListed);
router.post('/emd', auth.hasRole('admin'),emdCtrl.create);
router.post('/emd/getData',emdCtrl.getEmdData);
router.get('/emd/amount',emdCtrl.getEmdAmountData);
router.put('/emd/:id', auth.hasRole('admin'),emdCtrl.updateEmdData);
//router.delete('/emd/:id',auth.hasRole('admin'), emdCtrl.destroy);
router.put('/emd/delete/:id',auth.hasRole('admin'), emdCtrl.destroy);
router.post('/sendreqtocreateemd', auth.hasRole('admin'), emdCtrl.sendReqToCreateEmd);
router.get('/lot',lotCtrl.getLotData);
router.get('/lot/csv',auth.hasRole('admin'),lotCtrl.exportCSV);
router.get('/lotdata',lotCtrl.getLots);
//router.delete('/lot/:id',auth.hasRole('admin'), lotCtrl.destroy);
router.put('/lot/delete/:id',auth.hasRole('admin'), lotCtrl.destroy);
router.post('/lot', auth.hasRole('admin'), lotCtrl.create);
router.put('/lot/:id', auth.hasRole('admin'),lotCtrl.updateLotData);
router.put('/lot/updateproductlot/:id', auth.hasRole('admin'),lotCtrl.updateProductLotData);
router.get('/lot/lotsinauction',lotCtrl.getLotsInAuction);
router.post('/sendreqtocreatelot', auth.hasRole('admin'), lotCtrl.sendReqToCreateLot);
//Valuation Cancellation Fee master
router.get('/valuationcancellationfee',auth.hasRole('admin'),valuationCancellationCtrl.get);
router.get('/findcancellationfee',valuationCancellationCtrl.getValuationRequest,valuationCancellationCtrl.getCancellationFee);
router.post('/valuationcancellationfee',auth.hasRole('admin'),valuationCancellationCtrl.validate, valuationCancellationCtrl.create);
router.put('/valuationcancellationfee/:id',auth.hasRole('admin'),valuationCancellationCtrl.validate,valuationCancellationCtrl.update);
router.delete('/valuationcancellationfee/:id',auth.hasRole('admin'),valuationCancellationCtrl.destroy);

//router.get('/updatelots/isdeleted',lotCtrl.updatelotsisdeleted);
router.get('/inputform',auth.hasRole('admin'), inputFormCtrl.get);
router.post('/inputform', auth.hasRole('admin'),inputFormCtrl.create);
router.put('/inputform/:id', auth.hasRole('admin'),inputFormCtrl.update);
router.delete('/inputform/:id',auth.hasRole('admin'), inputFormCtrl.destroy);
router.post('/inputform/search',inputFormCtrl.search);

router.post('/offer',auth.hasRole('admin'),offerCtrl.create);
router.get('/offer/get', offerCtrl.get);
router.put('/offer/:id', auth.hasRole('admin'),offerCtrl.update);
router.delete('/offer/:id',auth.hasRole('admin'), offerCtrl.destroy);
router.post('/offerrequest',auth.isAuthenticated(),offerCtrl.createOfferRequest);
router.get('/offerrequest',auth.hasRole('admin'),offerCtrl.getOfferRequest);
//router.get('/offer/getfilterdata', offerCtrl.getFilterData);

router.post('/bookademo',bookADemoCtrl.create);
router.get('/bookademo',auth.hasRole('admin'),bookADemoCtrl.get);

router.get('/legaltype', legalEntityTypeCtrl.get);
router.post('/legaltype', auth.hasRole('admin'),legalEntityTypeCtrl.create);
router.put('/legaltype/:id', auth.hasRole('admin'),legalEntityTypeCtrl.update);
router.delete('/legaltype/:id',auth.hasRole('admin'), legalEntityTypeCtrl.destroy);

router.get('/bank', bankMasterCtrl.get);
router.post('/bank', auth.hasRole('admin'),bankMasterCtrl.create);
router.put('/bank/:id', auth.hasRole('admin'),bankMasterCtrl.update);
router.delete('/bank/:id',auth.hasRole('admin'), bankMasterCtrl.destroy);

router.get('/iquippogst', IquippoGstMasterCtrl.get);
router.post('/iquippogst', auth.hasRole('admin'),IquippoGstMasterCtrl.create);
router.put('/iquippogst/:id', auth.hasRole('admin'),IquippoGstMasterCtrl.update);
router.delete('/iquippogst/:id',auth.hasRole('admin'), IquippoGstMasterCtrl.destroy);

router.get('/newequipmentotherinfo', controller.getNewEquipmentOtherInfo);

module.exports = router;
