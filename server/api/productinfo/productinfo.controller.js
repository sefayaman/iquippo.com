'use strict';

var Model = require('./productinfo.model');
var APIError = require('../../components/_error');
var CategoryModel = require('../category/category.model');
var BrandModel = require('../brand/brand.model');
var ModelModel = require('../model/model.model');
var debug = require('debug')('api.productinfo.controller');
var _ = require('lodash');
var validator = require('validator');


function fetchCategory(category, cb) {
	CategoryModel.find({
		name: category
	}).exec(function(err, categoryData) {
		if (err) {
			debug(err);
			return cb(err);
		}

		return cb(null, categoryData);
	});
}

function fetchBrand(brand, cb) {
	var filter = {
		name: brand.name,
		'group.name': brand.group,
		'category.name': brand.category
	};

	BrandModel.find(filter).exec(function(err, brandData) {
		if (err) {
			debug(err);
			return cb(err);
		}

		return cb(null, brandData);
	});
}

function fetchModel(model, cb) {
	var filter = {
		name: model.name,
		'group.name': model.group,
		'category.name': model.category,
		'brand.name': model.brand
	};

	ModelModel.find(filter).exec(function(err, modelData) {
		if (err) {
			debug(err);
			return cb(err);
		}
		return cb(null, modelData);
	});
}

function validateData(data) {
	var err = ['model', 'category', 'brand', 'type'].filter(function(x) {
		if (!data[x])
			return x;
	});
	return err;
}


var productInfo = {
	fetch: function(req, res, next) {
		var query = null;
		var options = req.query || {};
		var filters = {};
		var sort = {
			'_id': -1
		};

		if (options.id && validator.isMongoId(options.id))
			filters._id = options.id;

		if (options.first_id && validator.isMongoId(options.first_id)) {
			filters._id = {
				'$gt': options.first_id
			};

			sort = {
				'_id': 1
			};
		}

		if (options.last_id && validator.isMongoId(options.last_id)) {
			filters._id = {
				'$lt': options.last_id
			};
		}

		if (options.last_id && validator.isMongoId(options.last_id) && options.first_id && validator.isMongoId(options.first_id)) {
			filters._id = {
				'$gt': options.first_id,
				'$lt': options.last_id
			};
		}

		if (options.searchStr && options.searchStr !== 'undefined') {
			filters['$text'] = {
				'$search': options.searchStr
			}
		}

		if (options.category && options.brand && options.model && options.category !== 'null' && options.brand !== 'null' && options.model !== 'null') {
			filters['information.category'] = options.category;
			filters['information.brand'] = options.brand;
			filters['information.model'] = options.model;
		}

		query = Model.find(filters);

		query = query.sort(sort);

		options.offset = Math.abs(Number(options.offset));

		if (options.offset)
			query = query.skip(options.offset);

		if (options.count)
			query = query.count();
		else
			query = query.limit(options.limit || 10);

		if (options.type)
			query = query.where('type').equals(options.type);

		query.exec(fetchData);

		function fetchData(err, info) {
			if (err)
				return next(err);

			if (!info && info !== 0)
				return next(new APIError(400, 'Error while fetching data from db'));

			if (options.first_id && options.first_id !== 'null')
				info = info.reverse();

			req.productInfo = info;
			return next();
		}

	},

	renderJson: function(req, res, next) {
		if (!req && !req.productInfo)
			return next(new APIError(400, 'No Report Data to render'));

		res.status(200).json(req.productInfo);
	},

	renderXLSX: function(req, res, next) {
		if (!req && !req.productInfo)
			return next(new APIError(400, 'No Report Data to render'));

		var productInfo = req.productInfo;
		var headers = ['Category', 'Brand', 'Model', 'Gross Weight', 'Operating Weight', 'Bucket Capacity', 'Engine Power', 'Lifting Capacity'];
		var json = {};
		var xlsxData = [];
		var arr = [];
		productInfo.forEach(function(x) {
			json = {};
			arr = [];
			arr.push(_.get(x, 'information.category', ''));
			arr.push(_.get(x, 'information.brand', ''));
			arr.push(_.get(x, 'information.model', ''));
			arr.push(_.get(x, 'information.grossWeight', ''));
			arr.push(_.get(x, 'information.operatingWeight', ''));
			arr.push(_.get(x, 'information.bucketCapacity', ''));
			arr.push(_.get(x, 'information.enginePower', ''));
			arr.push(_.get(x, 'information.liftingCapacity', ''));

			for (var i = 0; i < headers.length; i++) {
				json[headers[i]] = arr[i];
			}

			xlsxData.push(json);
		})

		res.xls('productinfo.xlsx', xlsxData);


	},

	create: function(req, res, next) {
		var body = req.body;

		if (!body)
			return next(new APIError(422, 'Missing manadatory parameters'));

		var error = validateData(body);

		if (error.length)
			return next(new APIError(422, 'Missing manadatory parameters: ' + error.toString()));

		fetchCategory(body.category, function(err, category) {
			if (err || !category)
				return next(err || new APIError(400, 'Error while fetching category'));

			if (!category.length)
				return res.status(404).json({msg:'Category not exist'});

			var brandFilter = {
				name: body.brand,
				category: body.category,
				group: category[0]._doc.group.name
			};

			fetchBrand(brandFilter, function(err, brand) {
				if (err || !brand)
					return next(err || new APIError(400, 'Error while fetching brand'));

				if (!brand.length)
					return res.status(404).json({msg:'Brand not exist'});

				var modelFilter = {
					name: body.model,
					category: body.category,
					group: category[0]._doc.group.name,
					brand: body.brand
				}

				fetchModel(modelFilter, function(err, model) {
					if (err || !model)
						return next(err || new APIError(400, 'Error while fetching model'));

					if (!model.length)
						return res.status(404).json({msg:'Model not exist'});

					var type = body.type;
					var createData = {
						type: type
					};

					switch (type) {
						case 'technical':
							createData = {
								type: type,
								information: {
									model: body.model,
									category: body.category,
									brand: body.brand,
									grossWeight: body.grossWeight,
									operatingWeight: body.operatingWeight,
									bucketCapacity: body.bucketCapacity,
									enginePower: body.enginePower,
									liftingCapacity: body.liftingCapacity
								}
							};
							break;
						default:
							return next(new APIError(400, 'Invalid choice'));
					}

					Model.create(createData, function(err, response) {
						if (err || !response) {
							debug(err);
							if (err && err.message && err.message.indexOf('duplicate') > -1) {
								return next(new APIError(409, 'Entry already exists'));
							}

							return next(err || new APIError(500, 'Error while saving product information'));
						}

						return res.status(200).json({
							msg: 'Created Successfully'
						});
					})
				})
			})
		})
	},

	update: function(req, res, next) {
		var params = req.params;
		var body = req.body;

		if (!params.id || !validator.isMongoId(params.id)) {
			return next(new APIError('Invalid id'));
		}

		if (!body)
			return next(new APIError(412, 'Nothing to update'));

		var error = validateData(body);

		if (error.length)
			return next(new APIError(422, 'Missing manadatory parameters: ' + error.toString()));

		Model.find({
			_id: params.id
		}, function(err, info) {
			if (err || !info) {
				return next(err || new APIError(500, 'Unable to fetch'));
			}

			if (!info.length) {
				return next(new APIError(404, 'No information found for id sent'));
			}

			fetchCategory(body.category, function(err, category) {
				if (err || !category)
					return next(err || new APIError(500, 'Error while fetching category'));

				if (!category.length)
					return res.status(404).json({msg:'Category not exist'});

				var brandFilter = {
					name: body.brand,
					category: body.category,
					group: category[0]._doc.group.name
				};

				fetchBrand(brandFilter, function(err, brand) {
					if (err || !brand)
						return next(err || new APIError(500, 'Error while fetching brand'));

					if (!brand.length)
						return res.status(404).json({msg:'Brand not exist'});

					var modelFilter = {
						name: body.model,
						category: body.category,
						group: category[0]._doc.group.name,
						brand: body.brand
					}

					fetchModel(modelFilter, function(err, model) {
						if (err || !model)
							return next(err || new APIError(500, 'Error while fetching model'));

						if (!model.length)
							return res.status(404).json({msg:'Model not exist'});

						var type = body.type;
						var updateData = {};

						switch (type) {
							case 'technical':
								updateData = {
									information: {
										model: body.model,
										category: body.category,
										brand: body.brand,
										grossWeight: body.grossWeight,
										operatingWeight: body.operatingWeight,
										bucketCapacity: body.bucketCapacity,
										enginePower: body.enginePower,
										liftingCapacity: body.liftingCapacity
									}
								};
								break;
							default:
								return next(new APIError(400, 'Invalid choice'));
						}

						Model.update({
							_id: params.id,
							type: type
						}, {
							$set: updateData
						}).exec(function(err, response) {
							if (err || !response) {
								debug(err || response);

								if (err && err.message && err.message.indexOf('duplicate') > -1) {
									return next(new APIError(409, 'Entry already exists'));
								}

								return next(err || new APIError(500, 'Error while saving product information'));
							}

							return res.status(200).json({
								msg: 'Updated Successfully'
							});
						})
					})
				})
			})
		})
	},
	delete: function(req, res, next) {
		var params = req.params;

		if (!params.id || !validator.isMongoId(params.id)) {
			return next(new APIError(400, 'Invalid id'));
		}

		Model.find({
				_id: params.id
			})
			.remove()
			.exec(function(err, doc) {
				debug(doc);
				if (err) {
					return next(err || new APIError(500, 'Error while deleting'));
				}
				return res.status(200).send({
					"msg": "Deleted Successfully"
				});
			});
	}
}

module.exports = productInfo;