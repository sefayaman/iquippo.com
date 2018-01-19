'use strict';

var express = require('express');
var controller = require('./dealermaster.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.get);
router.post('/',auth.hasRole("admin"),controller.validate,controller.create);
router.put('/:id',auth.hasRole("admin"),controller.validate,controller.update);
router.delete('/:id',auth.hasRole("admin"),controller.delete);

module.exports = router;
