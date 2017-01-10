'use strict';

var express = require('express');
var controller = require('./pricetrend.controller');

var router = express.Router();

router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/getonfilter', controller.getPriceTrendOnFilter);
router.post('/export', controller.exportPriceTrend);
router.post('/import', controller.importPriceTrend);
router.get('/migrate', controller.migratePriceTrend);

router.post('/savesurvey', controller.saveSurvey);
router.post('/surveyanalytics', controller.surveyAnalytics);
router.post('/surveyonfilter', controller.getSurveyOnFilter);

module.exports = router;