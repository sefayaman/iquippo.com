'use strict';

var express = require('express');
var controller = require('./finance.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', controller.getAll);
//router.get('/:id', controller.getOnId);
//router.post('/', controller.create);
//router.put('/:id', controller.update);
router.post('/financemaster/onfinancemasterfilter', controller.getFilterOnFinanceMaster);
router.post('/financemaster/getfinance', controller.getFinanceMaster);
router.delete('/financemaster/:id', controller.deleteFinanceMaster);
router.put('/financemaster/:id', controller.update);
//router.delete('/:id', controller.destroy);
//router.post('/onfilter', controller.getOnFilter);
//router.post('/export', controller.exportAuction);
router.get('/financemaster/get', controller.getAll);
router.post('/financemaster/save', controller.createFinanceMaster);
//router.put('/financemaster/:id', controller.updateFinanceMaster);
//router.post('/financemaster', controller.importFinanceMaster);
//router.delete('/financemaster/:id', controller.deleteFinanceMaster);
//router.post('/financemaster/rapitapi', controller.rapitApi);

module.exports = router;
