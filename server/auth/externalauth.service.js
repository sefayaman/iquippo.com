'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var validateJwt = expressJwt({ secret: config.secrets.extSession });

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function(req, res, next) {
      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }

      if (req.cookies && req.cookies.token) {
        try{
          req.headers.authorization = 'Bearer ' + JSON.parse(req.cookies.token);
        }catch(exc){
          return next(exc);
        }
      } 

      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function(req, res, next) {
      User.findById(req.user._id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.status(401).send('Unauthorized');
        if(req.query.mobile && req.query.mobile !== user.mobile)
          return res.status(401).send('Unauthorized');
        if(req.query.role && req.query.role !== user.role)
          return res.status(401).send('Unauthorized');
        req.user = user;
        next();
      });
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id,role,expireTime) {
  if(!expireTime)
    expireTime = 2;
  return jwt.sign({ _id: id }, config.secrets.extSession, { expiresInMinutes: expireTime });
}

function getToken(req,res){
  var token = extAuth.signToken(req.user._id,req.user.role,1);
  return res.status(200).send(token);
}

function validate(req,res){
  //var mobile = req.query.mobile;
  //if(!mobile || req.user.mobile !== mobile)
   // return res.status(200).send("Unauthorized");
  return res.status(200).send("Valid");
}

exports.isAuthenticated = isAuthenticated;
exports.signToken = signToken;
exports.getToken = getToken;
exports.validate = validate;