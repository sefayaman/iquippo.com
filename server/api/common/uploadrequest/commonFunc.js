'use strict';

var AuctionModel = require('../../auction/auction.model');
var ProductModel = require('../../product/product.model');
var AuctionMasterModel = require('../../auction/auctionmaster.model');
var CategoryModel = require('../../category/category.model');
var BrandModel = require('../../brand/brand.model');
var ModelModel = require('../../model/model.model');
var SpareModel = require('../../spare/spare.model');
var CountryModel = require('../country.model');
var LocationModel = require('../location.model');
var UserModel = require('../../user/user.model');
var ManufacturerModel = require('../manufacturer.model');



function fetchManufacturer(options, cb) {
	ManufacturerModel.find(options).exec(cb);
}


function fetchCountry(options, cb) {
	CountryModel.find(options).exec(cb);
}

function fetchStates(options, cb) {
	LocationModel.State.find(options).exec(cb);
}

function fetchCities(options, cb) {
	LocationModel.City.find(options).exec(cb);
}


function fetchUser(options, cb) {
	UserModel.find(options).exec(cb);
}


function fetchAuction(productFilter, cb) {
	AuctionModel.find({
		'product.assetId': productFilter.assetId
	}).exec(function(err, auction) {
		if (err) {
			return cb(err);
		}

		return cb(null, auction);
	});
}

function fetchProduct(assetId, cb) {
	ProductModel.find({
		assetId: assetId
	}).exec(function(err, product) {
		if (err) {
			return cb(err);
		}
		return cb(null, product);
	});
}

function fetchAuctionMaster(auctionId, cb) {
	AuctionMasterModel.find({
		auctionId: auctionId,
		startDate: {
			'$gt': new Date()
		}
	}).exec(function(err, auction) {

		if (err) {
			return cb(err);
		}

		return cb(null, auction);
	});
}

function fetchCategory(category, cb) {
	CategoryModel.find({
		name: category
	}).exec(function(err, categoryData) {
		if (err) {
			return cb(err);
		}

		return cb(null, categoryData);
	});
}

function fetchBrand(brand, cb) {
	/*var filter = {
		name: brand.name,
		'group.name': brand.group,
		'category.name': brand.category
	};*/
	var filter = {};
	if (Object.keys(brand).length) {
		if(brand.name)
			filter['name'] = brand.name;
		if(brand.group)
			filter['group.name'] = brand.group;
		if(brand.category)
			filter['category.name'] = brand.category;
	}

	console.log("fetch brand",filter);

	BrandModel.find(filter).exec(function(err, brandData) {
		if (err) {
			return cb(err);
		}

		return cb(null, brandData);
	});
}

function fetchModel(model, cb) {
	var filter = {};
	if (Object.keys(model).length) {
		if (model.group)
			filter['group.name'] = model.group;
		if (model.name)
			filter.name = model.name;
		if (model.category)
			filter['category.name'] = model.category;
		if (model.brand)
			filter['brand.name'] = model.brand;
	}

	ModelModel.find(filter).exec(function(err, modelData) {
		if (err) {
			return cb(err);
		}
		return cb(null, modelData);
	});
}

function fetchSpare(options, cb) {
	return SpareModel.find(options).exec(cb);
}


var commonFunc = {
	fetchAuction: fetchAuction,
	fetchModel: fetchModel,
	fetchBrand: fetchBrand,
	fetchProduct: fetchProduct,
	fetchAuctionMaster: fetchAuctionMaster,
	fetchCategory: fetchCategory,
	fetchSpare: fetchSpare,
	fetchCountry: fetchCountry,
	fetchCities: fetchCities,
	fetchStates: fetchStates,
	fetchUser: fetchUser,
	fetchManufacturer: fetchManufacturer
};

module.exports = commonFunc;


//Unit Test
if (require.main === module) {
	(function() {
		commonFunc.fetchCategory('Truck', console.log);
		commonFunc.fetchSpare({}, console.log);

	}());
}