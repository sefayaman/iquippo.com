'use strict';

var express = require('express');
var controller = require('./leadmasterdata.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', controller.getAll);
//router.get('/:id', controller.getOnId);
//router.post('/', controller.create);
//router.put('/:id', controller.update);
router.post('/leadmaster/onleadmasterfilter', controller.getFilterOnLeadMaster);
router.post('/leadmaster/onleadidmasterfilter', controller.getLeadIdFilterOnLeadMaster);

router.post('/leadmaster/export', controller.exportLeads);
//router.get('/financemaster/get', controller.getAll);
//router.post('/financemaster/save', controller.createFinanceMaster);

router.post('/leadmaster/rapitapi', controller.rapitApi);

module.exports = router;
