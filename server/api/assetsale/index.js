'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./assetsalebid.controller');
var productCtrl = require('./../product/product.controller');
var router = express.Router();

router.post('/bidproduct',auth.isAuthenticated(),controller.getSellers,controller.getBidProduct,productCtrl.search);
router.post('/submitbid',auth.isAuthenticated(),controller.validateSubmitBid,controller.submitBid);
router.put('/:id',auth.isAuthenticated(),controller.validateUpdate,controller.update,controller.postUpdate);
router.get('/',controller.getSellers,controller.fetchBid);
//router.get('/count/:productId');
router.get('/maxbidonproduct/',controller.getMaxBidOnProduct);
router.get('/count',controller.getBidCount);
router.post('/withdrawbid',auth.isAuthenticated(),controller.withdrawBid);
router.get('/bidorbuycalculation',controller.callculateGst,controller.callculateTcs,controller.callculateParkingCharge,controller.getBidOrBuyCalculation);
router.get('/getemd',controller.getEMDBasedOnUser);
router.get('/export',auth.isAuthenticated(),controller.getSellers,controller.exportExcel);

module.exports = router;

