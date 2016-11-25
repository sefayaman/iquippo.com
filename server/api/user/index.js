'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
//router.delete('/:id', controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
//router.get('/getuser/:id', controller.getUser);
router.post('/getuser', controller.getUser);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/update/:id', auth.hasRole('admin'), controller.update);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.signUp);
//router.post('/register', auth.hasRole('admin'), controller.create);
router.post('/register', controller.create);
router.post('/validateuser',controller.validateUser);
router.post('/validatesignup',controller.validateSignup);
router.post('/validateotp',controller.validateOtp);
router.post('/resetpassword',controller.resetPassword);
router.post('/export', controller.exportUsers);
router.post('/getproductscountonuserids', controller.getProductsCountOnUserIds);
// router.get('/', controller.getAll);


module.exports = router;
