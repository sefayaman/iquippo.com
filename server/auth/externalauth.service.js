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
  var token = signToken(req.user._id,req.user.role,20);
  return res.status(200).send(token);
}

function getTokenAndRedirectUrl(req,res){
  var result = {actionUrl:config.REDIRECT_URL};
  addNoCacheHeader(res);
  if(req.query._id){
    User.findById(req.query._id,function(err,user){
      if(err)
        return res.status(500).send(err);
      if(!user)
        return res.status(401).send('Unauthorized');
       var token = signToken(user._id,user.role,20);
       result.token = token;
       return res.status(200).json(result);
    });
  }else
    return res.status(200).json(result);
}

function validate(req,res){

  var resData = {};
  var user = req.user;
  var userEmail = user.email;
  var isCpDesk = false;
  if(userEmail){
    var emailParts = userEmail.split('@');
    if(emailParts.length && emailParts.length === 2 && emailParts[0].indexOf('cpdesk') !== -1 && emailParts[1] === 'iquippo.com')
      isCpDesk = true;
  }
  if(isCpDesk)
    resData.sourcing_user_type = "CD";
   else if(user.role === 'admin')
    resData.sourcing_user_type = "AD";
   else if(user.role === 'enterprise' && isServiceAvailed(user,'Finance'))
    resData.sourcing_user_type = "EU";
  else if(user.role === 'channelpartner')
    resData.sourcing_user_type = "CP";
   else
    resData.sourcing_user_type = "EC";
      
    var userName = user.fname;
    if(user.mname)
      userName += " " + user.mname;
    userName += " " + user.lname;
    resData.sourcing_user_name = userName;
    resData.sourcing_user_mobile = user.mobile;
    resData.email = user.email || "";
    resData.location = user.city || "";
    resData.dealership_name = user.company || "";
    addNoCacheHeader(res);
    return res.status(200).json(resData);
}

function isServiceAvailed(user,service){
    if(user.availedServices && user.availedServices.length > 0){
          for(var i=0;i<user.availedServices.length;i++){
           if(user.availedServices[i].code === service)
            return true;
          }
        }
        return false;
}

function addNoCacheHeader(res) {
   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
   res.header('Expires', '-1');
   res.header('Pragma', 'no-cache');
}

exports.isAuthenticated = isAuthenticated;
exports.signToken = signToken;
exports.getToken = getToken;
exports.getTokenAndRedirectUrl = getTokenAndRedirectUrl;
exports.validate = validate;