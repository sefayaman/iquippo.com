'use strict';

var fs = require('fs');
var config = require('../config/environment');
var Product = require('../api/product/product.model');
var root_path = config.appDomain + 'sitemapxml/';
var directory = config.root + '/sitemap/';

module.exports = function (done) {
    _countTotalProducts(function (err, count) {
        _checkDirectoryExist();
        _createStaticSitemap();
        _createProductsSitemap(function (err) {
            if (err) {
                return done(err);
            }
            _createSitemapIndex(done);
        });
    });
    // var currentTime = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
}

function _countTotalProducts(cb) {
    Product.count().lean().exec(function (err, products) {
        if (err) cb(err);
        return cb(null, products);
    });
}

function _checkDirectoryExist() {
    try {
        fs.statSync(directory);

        try {
            fs.readdirSync(directory).forEach(function (file) {
                fs.unlinkSync(directory + file);
            });
        } catch (e) {
            console.log(e);
        }

    } catch (e) {
        fs.mkdirSync(directory);
    }
}

function _createStaticSitemap() {

    var staticPaths = [
        'valuation', 'shipping', 'insurance', 'manpower', 'aboutus', 'contactus', 'new-equipment', 'used-equipment'
    ];
    var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    staticPaths.forEach(function (path) {
        xml += '<url>';
        xml += '<loc>' + config.appDomain + path + '</loc>';
        xml += '</url>';
    });
    xml += '</urlset>';
    var filepath = config.root + '/sitemap/sitemap-home.xml';
    _writeFileToDisk(filepath, xml);
}

function _createProductsSitemap(cb) {
    var skip = 0;
    var limit = 200;
    var sitemapPath = directory + 'sitemap-products-';
    _readSitemapDirectory(function (err, files) {
        if (err) {
            return cb(err);
        }
        if (files.length > 1) {
            var filenameSuffix = files[files.length - 1].split('-')[2];
            var path = directory + files[files.length - 1];

            skip = limit * Number(filenameSuffix.split('.')[0]);
            var nextFilename = sitemapPath + (Number(filenameSuffix.split('.')[0]) + 1) + '.xml';
            _queryProduct(limit, skip, nextFilename, cb);
        } else {
            var filename = sitemapPath + '1.xml';
            _queryProduct(limit, skip, filename, cb);
        }
    });
}

function _queryProduct(limitCounter, skipCounter, filepath, cb) {
    Product.find().limit(limitCounter).skip(skipCounter).lean().exec(function (err, products) {
        if (err) { return cb(err); }
        var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        for (var i in products) {
            xml += '<url>';
            xml += '<loc>' + config.appDomain + products[i].productCondition + '-equipment/' + products[i].category.name + '/' + (products[i].brand.name).replace('&', "&amp;") + '/' + products[i].assetId + '</loc>';
            xml += '</url>';
            i++;
        }
        xml += '</urlset>';
        _writeFileToDisk(filepath, xml);
        if (products.length === limitCounter) {
            _createProductsSitemap(cb);
        } else {
            cb(null);
        }
    });
}

function _createSitemapIndex(done) {
    _readSitemapDirectory(function (err, files) {
        if (err) {
            return done(err);
        }
        var xml = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        files.forEach(function (file) {
            xml += '<sitemap>';
            xml += '<loc>' + root_path + file.split('.')[0] + '</loc>';
            xml += '</sitemap>';
        });
        xml += '</sitemapindex>';
        var filepath = config.root + '/sitemap.xml';
        fs.writeFile(filepath, xml, function (err) {
            if (err) {
                return done(err);
            }
            return done(files);
        });
    });
}

function _readSitemapDirectory(cb) {
    var path = config.root + '/sitemap/';
    fs.readdir(path, function (err, files) {
        if (err) cb(err);
        cb(null, files);
    });
}

function _writeFileToDisk(filepath, xml) {
    fs.writeFile(filepath, xml, function (err) {
        if (err) throw err;
    });
}