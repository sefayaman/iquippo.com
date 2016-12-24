'use strict';

var express = require('express');
var controller = require('./auction.controller');
//var auctionDateController=require('./auctiondate.controller');
//var auctionDetailController=require('./auctionDetail.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/onfilter', controller.getOnFilter);
router.post('/export', controller.exportAuction);
router.get('/auctionmaster/get', controller.getAuctionMaster);
router.post('/auctionmaster/save', controller.createAuctionMaster);
router.put('/auctionmaster/:id', controller.updateAuctionMaster);
router.post('/auctionmaster', controller.importAuctionMaster);
router.delete('/auctionmaster/:id', controller.deleteAuctionMaster);
router.post('/auctionmaster/onauctionmasterfilter', controller.getFilterOnAuctionMaster);
//router.get('/auctionmaster/getAuctionCount', auctionDateController.count);
//router.get('/auctionmaster/fetchAuctionData',auctionDateController.fetch,auctionDateController.renderJson);
//router.get('/auctionmaster/getAuctionItemsCount',auctionDetailController.count);
//router.get('/auctionmaster/fetchAuctionItemsData',auctionDetailController.fetch);

router.post('/upload/excel',controller.bulkUpload);

router.post('/auctionmaster/getauctionwiseproductdata', controller.getAuctionWiseProductData);

module.exports = router;
