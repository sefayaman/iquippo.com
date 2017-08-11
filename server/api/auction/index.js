'use strict';

var express = require('express');
var controller = require('./auction.controller');
var userRegForAuction = require('./userregisterforauction.controller');
var auth = require('../../auth/auth.service');
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
router.post('/getauctiondata', controller.getAuctionInfoForProduct);
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

//router.get('/userregforauction', userRegForAuction.get);
router.post('/userregforauction', userRegForAuction.create);
router.post('/userregforauction/filterregisteruser', userRegForAuction.getFilterOnRegisterUser);
//router.put('/userregforauction/:id', userRegForAuction.update);
//router.delete('/userregforauction/:id', userRegForAuction.destroy);
router.post('/userregforauction/validateuser', userRegForAuction.validateUser);
router.post('/userregforauction/export', auth.hasRole('admin'), userRegForAuction.exportData);

router.post('/upload/excel',controller.bulkUpload);

router.post('/auctionmaster/getauctionwiseproductdata', controller.getAuctionWiseProductData);

module.exports = router;
