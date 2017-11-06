'use strict';

var express = require('express');
var controller = require('./payment.controller');

var router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getOnId);
router.post('/', controller.create);
router.post('/offline', controller.createoffline);
router.put('/:id', controller.update);
//router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.post('/onfilter', controller.getOnFilter);
router.post('/export', controller.exportPayment);
router.post('/encrypt', controller.encrypt);
router.post('/paymentresponse', controller.paymentResponse);
router.post('/sendreqtocreateuser', controller.sendReqToCreateUser);

module.exports = router;
