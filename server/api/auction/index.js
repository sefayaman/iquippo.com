'use strict';

var express = require('express');
var controller = require('./auction.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
//router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/onfilter', controller.getOnFilter);
router.post('/export', controller.exportAuction);

router.get('/auctionmaster', controller.getAuctionMaster);
router.post('/auctionmaster/save', controller.createAuctionMaster);
//router.put('/auctionmaster/:id', controller.updateAuctionMaster);
router.post('/auctionmaster', controller.importAuctionMaster);
router.delete('/auctionmaster/:id', controller.deleteAuctionMaster);

module.exports = router;
