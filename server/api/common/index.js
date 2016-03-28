'use strict';

var express = require('express');
var controller = require('./common.controller');

var router = express.Router();

router.get('/countries', controller.getAllCountry);
router.post('/sendOtp', controller.sendOtp);
router.post('/notificationTemplate', controller.compileHtml);
router.post('/gethelp', controller.getHelp);
router.post('/buildsuggestion', controller.buildSuggestion);
router.post('/importMasterData', controller.importMasterData);
router.post('/deleteMasterData', controller.deleteMasterData);
router.post('/updateMasterData', controller.updateMasterData);
router.post('/rotate', controller.rotate);
router.post('/saveasimage', controller.saveAsImage);
router.post('/upsertsetting', controller.upsertSetting);
router.post('/getsettingonkey', controller.getSettingByKey);

module.exports = router;