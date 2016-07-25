'use strict';

var express = require('express');
var controller = require('./invitation.controller');

var router = express.Router();

//router.get('/', controller.getAll);
router.get('/generatecoupon/:id', controller.getCouponOnId);
router.post('/generatecoupon', controller.createCoupon);
router.put('/generatecoupon/:id', controller.updateCoupon);
//router.delete('/:id', controller.destroy);
//router.post('/search', controller.search);
router.get('/wallettransaction/:id', controller.getTransactionOnId);
router.post('/wallettransaction', controller.createWalletTransaction);
router.put('/wallettransaction/:id', controller.updateWalletTransaction);

router.post('/joindusers', controller.getAllJoinedUsersOnId);
router.post('/checkvalidity', controller.checkCodeValidity);

router.post('/upsert', controller.upsertMasterData);
router.post('/getsetting', controller.getSetting);

module.exports = router;