'use strict';

var express = require('express');
var controller = require('./bid.controller');

var router = express.Router();

router.get('/', controller.getAllBid);
router.post('/', controller.createBid);
router.put('/:id', controller.updateBid);
router.delete('/:id', controller.deleteBid);
router.post('/onfilter', controller.getOnFilter);
router.post('/gethighestbids', controller.getHighestBids);

module.exports = router;
