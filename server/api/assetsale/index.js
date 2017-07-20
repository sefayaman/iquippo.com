'use strict';

var express = require('express');
var controller = require('./assetsalebid.controller');
var router = express.Router();

router.post('/submitbid', controller.submitBid);
router.get('/', controller.fetchBid);
//router.get('/count/:productId');
router.get('/maxbidonproduct/', controller.getMaxBidOnProduct);
router.get('/fa', controller.fetchFAData);
router.get('/count',controller.getBidCount);
//router.get('/fetchhigherbid', controller.fetchHigherBid);
router.post('/withdrawBid',controller.withdrawBid);

module.exports = router;

