'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./assetsalebid.controller');
var productCtrl = require('./../product/product.controller');
var router = express.Router();

router.post('/bidproduct',auth.isAuthenticated(), controller.getBidProduct,productCtrl.search);
router.post('/submitbid', controller.submitBid);
router.put('/:id', controller.update);
router.get('/', controller.fetchBid);
//router.get('/count/:productId');
router.get('/maxbidonproduct/', controller.getMaxBidOnProduct);
router.get('/count',controller.getBidCount);
router.post('/withdrawbid',controller.withdrawBid);
router.get('/bidorbuycalculation',controller.getBidOrBuyCalculation);

module.exports = router;

