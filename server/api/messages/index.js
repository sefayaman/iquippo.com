'use strict';

var express = require('express');
var controller = require('./message.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/usersmails', auth.isAuthenticated(), controller.getusersmails);
router.get('/:emailid', auth.isAuthenticated(), controller.getmail);

router.post('/', auth.isAuthenticated(), controller.create);
// router.post('/insertreply/:messid', controller.insertreply);

router.put('/:emailid', auth.isAuthenticated(), controller.updatemail);

module.exports = router;