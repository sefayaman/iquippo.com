'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../api/user/user.model');
var auth = require("./auth.service");
// Passport Configuration
require('./local/passport').setup(User, config);
require('./google/passport').setup(User, config);
require('./facebook/passport').setup(User, config);
require('./twitter/passport').setup(User, config);
require('./linkedin/passport').setup(User, config);

var router = express.Router();

router.use('/local', require('./local'));
router.use('/google', require('./google'));
router.use('/facebook', require('./facebook'));
router.use('/twitter', require('./twitter'));
router.use('/linkedin', require('./linkedin'));

//Authentication for external client
router.get("/gettoken",auth.isAuthenticated(),function(req,res){
	var token = auth.signToken(req.user._id,req.user.role,1);
	return res.status(200).send(token);
});

router.get("/validate",auth.isAuthenticated(),function(req,res){
	var mobile = req.query.mobile;
	if(!mobile || req.user.mobile !== mobile)
		return res.status(200).send("Unauthorized");
	return res.status(200).send("Valid");
});


module.exports = router;