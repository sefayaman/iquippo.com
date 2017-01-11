'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');

var router = express.Router();

router
  .get('/', passport.authenticate('twitter', {
    failureRedirect: '/',
    session: false
  },{ scope: 'email' }))
  .get('/callback', passport.authenticate('twitter', {
    failureRedirect: '/',
    session: false
  }), auth.setTokenCookie);

module.exports = router;