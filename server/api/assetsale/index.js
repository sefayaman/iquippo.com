'use strict';

var express = require('express');
var controller = require('./assetsalebid.controller');
var router = express.Router();

router.post('/submitbid',controller.submitBid);
router.get('/',controller.fetchBid);
router.get('/count/:productId');
module.exports = router;

