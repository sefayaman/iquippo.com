/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var passport = require('passport');
var cors = require('cors');
var expressSession = require('express-session');

module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({
    extended: false,
    limit: "25mb"
  }));
  app.use(bodyParser.json({
    limit: "25mb"
  }));
  app.use(bodyParser({
    keepExtensions: true,
    uploadDir: 'c:/temp',
    limit: '25mb'
  }));
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(cors());
  //app.use(passport.initialize());
  app.use(expressSession({
    secret: config.secrets.session
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  //app.use(require('connect-livereload')({ignore: ['.pdf','.docx']}));
  console.log(config.root);
  // if ('production' === env) {
  //   app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
  //   app.use(express.static(path.join(config.root, 'public')));
  //   app.set('appPath', path.join(config.root, 'public'));
  //   app.use(morgan('dev'));
  // }

  // if ('staging' === env) {
  //   app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
  //   app.use(express.static(path.join(config.root, 'public')));
  //   app.set('appPath', path.join(config.root, 'public'));
  //   app.use(morgan('dev'));
  // }
  
    if ('development' === env || 'local' === env) {
    //app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', path.join(config.root, 'client'));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  } else {
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', path.join(config.root, 'public'));
    app.use(morgan('dev'));
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {}
      });
    });
  }

  app.head('*', function(req, res, next) {
    res.status(501).end();
  });
  app.all('*', function(req, res, next) {
    res.setHeader('Last-Modified', (new Date()).toUTCString());
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    res.setHeader('Expires', new Date(Date.now() + 86400000).toISOString());
    res.setHeader('Cache-Control', 'private, max-age=2592000');
    if (req.method == 'OPTIONS') {
      res.status(200).end();
    } else {
      next();
    }
  });
};