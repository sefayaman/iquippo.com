'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var controller = require("./passport");

var router = express.Router();

router
  .get('/', passport.authenticate('facebook', {
    failureRedirect: '/',
    session: false
  },{scope: 'email'}))
  .get('/callback', passport.authenticate('facebook', {
    failureRedirect: '/',
    session: false
  }), auth.setTokenCookie);
router.post('/mobilelogin', controller.login);
module.exports = router;