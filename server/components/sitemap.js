'use strict';

var fs = require('fs');
var async = require('async');
var config = require('../config/environment');
var Brand = require('../api/brand/brand.model');
var Category = require('../api/category/category.model');
var Group = require('../api/group/group.model');
var Product = require('../api/product/product.model');
var root_path = config.serverPath + '/sitemapxml/';
var directory = config.root + '/sitemap/';
var URL_ENTRY_PER_FILE = 10000;
var TIME_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3d
var STATIC_PATHS = [
    'valuation/',
    'shipping/',
    'insurance/',
    'manpower/',
    'aboutus/',
    'contactus/',
    'privacy/',
    'brands/',
    'new-equipment/',
    'new-equipment/brands/',
    'new-equipment/allcategories/',
    'used-equipment/',
    'used-equipment/brands/',
    'used-equipment/allcategories/'
];

module.exports = {
    init: init
}

function init() {
    _checkDirectoryExist();
    async.parallel([
        _createStaticSitemap,
        _createProductsSitemap,
        _multiModelFetch
    ], function (err) {
        if (err) { throw err; }
        _createSitemapIndex(function (err) {
            if (err) { throw err; }
            setTimeout(function () {
                init();
            }, TIME_INTERVAL);
        });
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

function _createStaticSitemap(cb) {
    var staticPaths = STATIC_PATHS;
    var xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    staticPaths.forEach(function (path) {
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/' + path + '</loc>';
        xml += '</url>';

    });
    xml += '</urlset>';
    var filepath = config.root + '/sitemap/sitemap-home.xml';
    fs.writeFile(filepath, xml, function (err) {
        if (err) { cb(err); }
        cb(null);
    });
}

function _createProductsSitemap(cb) {
    var sitemapPath = directory + 'sitemap-products-';
    var xmlArray = [];
    Product.find()
        .select('assetId productCondition category brand')
        .lean()
        .exec(function (err, products) {
            if (err) { return cb(err); }
            for (var i in products) {
                var xml = "";
                xml += '<url>';
                xml += '<loc>' + config.serverPath + '/' + products[i].productCondition + '-equipment/' + _transformUrl(products[i].category.name) + '/' + _transformUrl((products[i].brand.name).replace('&', "&amp;")) + '/' + products[i].assetId + '/' + '</loc>';
                xml += '</url>';

                if (products[i].group) {
                    xml += '<url>';
                    xml += '<loc>' + config.serverPath + '/' + products[i].productCondition + '-equipment/' + _transformUrl(products[i].group.name) + '/' + _transformUrl(products[i].category.name) + '/' + '</loc>';
                    xml += '</url>';
                }
                i++;
                xmlArray.push(xml);
            }

            var limit = URL_ENTRY_PER_FILE;
            var count = 1;
            var length = xmlArray.length;
            var start = 0;
            var end = limit * count;

            _writeXMLToFile(start, end, count, limit, length, xmlArray, cb);

        });
}

function _writeXMLToFile(start, end, count, limit, length, xmlArray, cb) {
    if (end < length) {
        var xmlContent = xmlArray.slice(start, end);
        xmlContent.unshift('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        xmlContent.push('</urlset>');
        xmlContent = xmlContent.join("");

        var filepath = directory + 'sitemap-products-' + count + '.xml';
        fs.writeFile(filepath, xmlContent, function (err) {
            if (err) { cb(err); }
            count++; start = end; end = limit * count;
            _writeXMLToFile(start, end, count, limit, length, xmlArray, cb);
        });
    } else {
        var xmlContent = xmlArray.slice(start, length);
        xmlContent.unshift('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        xmlContent.push('</urlset>');
        xmlContent = xmlContent.join("");

        var filepath = directory + 'sitemap-products-' + count + '.xml';
        fs.writeFile(filepath, xmlContent, function (err) {
            if (err) { cb(err); }
            cb(null);
        });
    }
}

function _multiModelFetch(cb) {
    async.parallel([
        queryBrand,
        queryCategory,
        queryGroup
    ], function (err, responses) {
        createMixedSitemap(responses, function (err) {
            if (err) { cb(err); }
            cb(null);
        })
    });
}

function queryBrand(callback) {
    Brand.find().select('name group category').lean().exec(function (err, brands) {
        if (err) { callback(err); }
        callback(null, brands);
    });
}

function queryCategory(callback) {
    Category.find().select('name').lean().exec(function (err, categories) {
        if (err) { callback(err); }
        callback(null, categories);
    });
}

function queryGroup(callback) {
    Group.find().select('name').lean().exec(function (err, groups) {
        if (err) { callback(err); }
        callback(null, groups);
    });
}

function createMixedSitemap(responses, cb) {
    var xmlArray = [];
    var brands = responses[0];
    var categories = responses[1];
    var groups = responses[2];

    _generateCategorySitemap(xmlArray, categories);
    _generateBrandSitemap(xmlArray, brands);
    _generateGroupSitemap(xmlArray, groups);

    xmlArray.unshift('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    xmlArray.push('</urlset>');
    xmlArray = xmlArray.join("");

    var filepath = config.root + '/sitemap/sitemap-products-category.xml';
    fs.writeFile(filepath, xmlArray, function (err) {
        if (err) { cb(err); }
        cb(null);
    });
}

function _generateCategorySitemap(xmlArray, categories) {
    categories.forEach(function (category) {
        var xml = ""
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/new-equipment/' + _transformUrl(category.name) + '/' + '</loc>';
        xml += '</url>';
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/used-equipment/' + _transformUrl(category.name) + '/' + '</loc>';
        xml += '</url>';
        xmlArray.push(xml);
    });
}

function _generateBrandSitemap(xmlArray, brands) {
    brands.forEach(function (brand) {
        var xml = "";
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/new-equipment/brands/' + _transformUrl(brand.name.replace('&', "&amp;")) + '/' + '</loc>';
        xml += '</url>';
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/used-equipment/brands/' + _transformUrl(brand.name.replace('&', "&amp;")) + '/' + '</loc>';
        xml += '</url>';
        xmlArray.push(xml);
    });
}

function _generateGroupSitemap(xmlArray, groups) {
    groups.forEach(function (group) {
        var xml = "";
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/new-equipment/' + _transformUrl(group.name) + '/' + '</loc>';
        xml += '</url>';
        xml += '<url>';
        xml += '<loc>' + config.serverPath + '/used-equipment/' + _transformUrl(group.name) + '/' + '</loc>';
        xml += '</url>';
        xmlArray.push(xml);
    });
}

function _createSitemapIndex(done) {
    _readSitemapDirectory(function (err, files) {
        if (err) { done(err); }
        var xml = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        files.forEach(function (file) {
            xml += '<sitemap>';
            xml += '<loc>' + root_path + file.split('.')[0] + '/' + '</loc>';
            xml += '</sitemap>';
        });
        xml += '</sitemapindex>';
        var filepath = config.root + '/sitemap.xml';
        fs.writeFile(filepath, xml, function (err) {
            if (err) { done(err); }
            done(null);
        });
    });
}

function _readSitemapDirectory(cb) {
    var path = config.root + '/sitemap/';
    fs.readdir(path, function (err, files) {
        if (err) { cb(err); }
        cb(null, files);
    });
}

function _transformUrl(url) {
    return url.split(" ").join("_");
}