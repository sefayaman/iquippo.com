/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');
var config = require("./config/environment");
var fs = require('fs');

module.exports = function (app) {

  // Insert routes below
  app.use('/api/finance', require('./api/finance'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/products', require('./api/product'));
  app.use('/api/contactus', require('./api/contactus'));
  app.use('/api/category', require('./api/category'));
  app.use('/api/callback', require('./api/callback'));
  app.use('/api/group', require('./api/group'));
  app.use('/api/vendor', require('./api/vendor'));
  app.use('/api/quote', require('./api/quote'));
  //app.use('/api/buyer', require('./api/buyer'));
  app.use('/auth', require('./auth'));
  app.use('/api/common', require('./api/common'));
  app.use('/api/classifiedad', require('./api/classifiedad'));
  app.use('/api/productquote', require('./api/productquote'));
  app.use('/api/cart', require('./api/cart'));
  app.use('/api/brand', require('./api/brand'));
  app.use('/api/model', require('./api/model'));
  app.use('/api/services', require('./api/services'));
  app.use('/api/invitation', require('./api/invitation'));
  app.use('/api/appnotification', require('./api/appnotification'));
  app.use('/api/manpower', require('./api/manpower'));
  app.use('/api/valuation', require('./api/valuation'));
  app.use('/api/payment', require('./api/payment'));
  app.use('/api/auction', require('./api/auction'));
  app.use('/api/spare', require('./api/spare'));
  app.use('/api/messages', require('./api/messages'));
  app.use('/api/bid', require('./api/bid'));
  app.use('/api/inputform', require('./api/inputform'));
  app.use('/api/pricetrend', require('./api/pricetrend'));
  app.use('/api/reports', require('./api/reports'));
  app.use('/api/product/information', require('./api/productinfo'));
  app.use('/api/servicerequest', require('./api/servicerequest'));
  app.use('/api/negotiate', require('./api/negotiation'));
  app.use('/api/policies', require('./api/policies'));
  app.use('/api/getseo', require('./api/getseo'));
  app.use('/api/enterprise', require('./api/enterprise'));
  app.use('/api/assetsale', require('./api/assetsale'));
  //app.use('/api/producthistory', require('./api/producthistory'));
  app.use('/api/lead', require('./api/lead'));
  app.use('/api/dealer', require('./api/dealer'));
  app.use('/api/certificate', require('./api/certificate'));
  // app.use('/api/newequipment', require('./api/newequipment'));
  app.use('/api/techspec', require('./api/techspec'));
  app.use('/api/newequipmentbanners', require('./api/newequipmentbanners'));
  app.use('/api/equipmentorder', require('./api/equipmentorder'));
  app.use('/api/bannerlead', require('./api/bannerlead'));


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  app.route("/download/:assetDir/:filename")
    .get(function (req, res) {
      var fileName = req.params.filename;
      var assetDir = req.params.assetDir;
      var file = config.uploadPath + assetDir + "/" + fileName;
      res.download(file); // Set disposition and send it.
    })

  app.route("/download/:assetDir/:filename/imageFile")
    .get(function (req, res) {
      var fileName = req.params.filename;
      var assetDir = req.params.assetDir;
      var file = config.uploadPath + assetDir + "/" + fileName;
      res.download(file); // Set disposition and send it.
    })

  app.get('/sitemap.xml', function (req, res) {
    res.setHeader('Cache-Control', 'private, no-cache');
    return res.sendFile(config.root + '/sitemap.xml');
  });

  app.get('/sitemapxml/:name', function (req, res) {
    var filepath = config.root + '/sitemap/' + req.params.name + '.xml';
    try {
      fs.statSync(filepath);
      res.setHeader('Cache-Control', 'private, no-cache');
      return res.sendFile(filepath);
    } catch (e) {
      res.setHeader('Cache-Control', 'private, no-cache');
      res.redirect('/sitemap.xml');
    }
  });

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
