'use strict';

var _ = require('lodash');
var xslx = require('xlsx');
var Seq = require('seq');
var trim = require('trim');
var Country = require('./country.model');
var State = require('./location.model').State;
var City = require('./location.model').City;
var Subscribe = require('./subscribe.model');
var AppSetting = require('./setting.model');
var PaymentMaster = require('./paymentmaster.model');
var ManufacturerMaster = require('./manufacturer.model');
var Banner = require('./banner.model');
var email = require('./../../components/sendEmail.js');
var sms = require('./../../components/sms.js');
var handlebars = require('handlebars');
var fs = require('fs')
var gm = require("gm");
// var lwip = require("lwip");
var fsExtra = require('fs.extra');
var _ = require('lodash');
var User = require('./../user/user.model');
var Group = require('./../group/group.model');
var Category = require('./../category/category.model');
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');
var Product = require('./../product/product.model');
var config = require('./../../config/environment');

var SearchSuggestion = require('./searchsuggestion.model');
var SavedSearch = require('./savedsearch.model');

var importPath = config.uploadPath + config.importDir + "/";



//

var APIError = require('../../components/_error');
var debug = require('debug')('api.productinfo.controller');
//var _ = require('lodash');
var validator = require('validator');
var async = require('async');


//

exports.sendOtp = function(req, res) {
	var isOnMobile = req.body.otpOn == 'mobile' ? true : false;
	var otp = Math.round(Math.random() * 1000000) + "";
	var data = {};
	data.subject = 'OTP Message';
	data.content = req.body.content + otp;
	req.otp = otp;
	//var fn = null; 
	if (isOnMobile) {
		data.to = req.body.mobile;
		data.countryCode = req.body.countryCode;
		postOtpRequest(sms.sendSMS, data, req, res);
		//fn = sms.sendSMS;
	} else {
		data.to = req.body.email;
		//req.body.templateName = "userRgeOTP";
		//req.body.data = {};
		//req.body.data.otp = otp;
		//req.body.data.serverPath = config.serverPath;
		exports.compileTemplate({
				otp: otp
			}, config.serverPath, "userRgeOTP", function(isSuccess, text) {
				if (isSuccess) {
					data.content = text;
					postOtpRequest(email.sendMail, data, req, res);
				} else
					handleError(res, {});

			})
			//fn = email.sendMail;
	}


}

function postOtpRequest(fn, data, req, res) {
	var sendOtpToClient = req.body.sendToClient == 'y' ? true : false;
	if (data.to) {
		fn(data, req, res, function(req1, res1, isSent) {
			//console.log(otp);
			if (isSent) {
				if (sendOtpToClient)
					return res.status(200).send("" + req.otp);
				else {
					var otpObj = {};
					otpObj['otp'] = req.otp;
					otpObj.createdAt = new Date();
					User.update({
						_id: req.body.userId
					}, {
						$set: {
							otp: otpObj
						}
					}, function(err, userObj) {
						if (err) {
							return handleError(res, err);
						}
						return res.status(200).send("");
					});

				}

			} else {
				return res.status(400).send("There is some issue.Please try again.");
			}
		});
	} else {
		return res.status(400).send("Insufficient data");
	}
}

exports.compileHtml = function(req, res) {
	var dataObj = req.body.data;
	var tplName = req.body.templateName;
	if (!tplName || !dataObj)
		return res.status(404).send("template not found");
	fs.readFile(__dirname + '/../../views/emailTemplates/' + tplName + ".html", 'utf8', function(err, data) {
		if (err) {
			return handleError(res, err);
		}
		var tempFun = handlebars.compile(data);
		var text = tempFun(dataObj);
		var cb = null;
		return res.status(200).send(text);
	});
}

exports.compileTemplate = function(dataObj, serverPath, tplName, cb) {
	if (!tplName || !dataObj)
		return cb(false, "");
	fs.readFile(__dirname + '/../../views/emailTemplates/' + tplName + ".html", 'utf8', function(err, data) {
		if (err) {
			console.log(err);
			return cb(false, "");
		}
		var tempFun = handlebars.compile(data);
		dataObj.serverPath = serverPath;
		var text = tempFun(dataObj);
		cb(true, text);
	});

}

exports.getHelp = function(req, res) {
	var term = new RegExp("^" + req.body.txt, 'i');
	var query = SearchSuggestion.find({
		text: {
			$regex: term
		}
	});
	console.log(req.body.txt);
	query.exec(
		function(err, searchs) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json(searchs);
		}
	);
}

exports.buildSuggestion = function(req, res) {
	var suggestions = req.body;
	req.counter = 0;
	if (!suggestions || suggestions.length == 0)
		return res.status(400).send("No data found");
	buildSuggestion(req, res, suggestions);
}


exports.upsertSetting = function(req, res) {

	var key = req.body.key;
	if (!key)
		return res.status(400).send("Invalid request");
	AppSetting.find({
		key: key
	}, function(err, dt) {
		if (err) {
			return handleError(res, err)
		} else if (dt.length == 0) {
			AppSetting.create(req.body, function(err, val) {
				if (err) {
					return handleError(res, err)
				} else {
					console.log("created");
					res.status(200).send("done");
				}
			});
		} else {
			var setObj = {};
			if (req.body.value) {
				setObj.value = req.body.value
				setObj.updatedAt = new Date();
			} else {
				setObj.valueObj = req.body.valueObj
				setObj.updatedAt = new Date();
			}
			AppSetting.update({
				key: key
			}, {
				$set: setObj
			}, function(err, val) {
				if (err) {
					return handleError(res, err)
				} else {
					console.log("updated", dt);
					res.status(200).send("done");
				}
			})
		}
	});

}
exports.getSettingByKey = function(req, res) {
	AppSetting.findOne({
		key: req.body.key
	}, function(err, dt) {
		if (err) {
			return handleError(res, err)
		} else {
			res.setHeader('Cache-Control', 'private, max-age=2592000');
			res.status(200).json(dt)
		}

	});
}

exports.updateMasterData = function(req, res) {
	var reqData = req.body;
	var type = reqData.type;
	var _id = reqData._id;
	delete reqData.type;
	delete reqData._id;
	var filter = {};
	reqData.updatedAt = new Date();
	switch (type) {
		case "Group":
			Seq()
				.seq(function() {
					var self = this;
					var filter = {};
					filter["name"] = {
						$regex: new RegExp("^" + reqData.name + "$", 'i')
					};
					var query = Group.find(filter);
					query.exec(function(err, gps) {
						if (err) {
							return handleError(res, err);
						}
						if (gps.length > 0 && gps[0]._id != _id) {
							return res.status(400).send("Group already exist.");
						}
						self();
					})
				})
				.seq(function() {
					var self = this;
					Group.update({
						_id: _id
					}, {
						$set: reqData
					}, function(err, gp) {
						if (err) {
							return handleError(res, err);
						}
						//update Product Information
						//Product.update({group._id:_id},{$set:{productName:""}});
						self();
					});
				})
				.seq(function() {
					var self = this;
					Category.update({
						"group._id": _id
					}, {
						$set: {
							"group.name": reqData.name
						}
					}, {
						multi: true
					}, function(err, ct) {
						if (err) {
							return handleError(res, err);
						}
						self();
					});
				})
				.seq(function() {
					var self = this;
					Brand.update({
						"group._id": _id
					}, {
						$set: {
							"group.name": reqData.name
						}
					}, {
						multi: true
					}, function(err, br) {
						if (err) {
							return handleError(res, err);
						}
						self();
					});
				})
				.seq(function() {
					var self = this;
					Model.update({
						"group._id": _id
					}, {
						$set: {
							"group.name": reqData.name
						}
					}, {
						multi: true
					}, function(err, md) {
						if (err) {
							return handleError(res, err);
						}
						res.status(200).send(type + " updated successfully");
					});
				})

			Product.find({
				"group._id": _id
			}, function(err, res) {
				if (err) {
					return handleError(res, err);
				}
				res.forEach(function(x) {

					x.group = {
						"_id": _id,
						name: reqData.name
					};
					//x.name=x.category.name + x.brand.name + reqData.name + ((x.variant && x.variant.name) || " ");
					Product.update({
						"_id": x._id
					}, {
						$set: {
							"group": x.group
						}
					}, function(err, updt) {
						if (err) {
							return handleError(res, err);
						}
						console.log(updt);
					})
				})

			});
			break;
		case "Category":
			Seq()
				.seq(function() {
					var self = this;
					var filter = {};
					filter["name"] = {
						$regex: new RegExp("^" + reqData.name + "$", 'i')
					};
					filter["group.name"] = {
						$regex: new RegExp("^" + reqData.group.name + "$", 'i')
					};
					var query = Category.find(filter);
					query.exec(function(err, gps) {
						if (err) {
							return handleError(res, err);
						}
						if (gps.length > 0 && gps[0]._id != _id) {
							return res.status(400).send("Category already exist.");
						}
						self();
					})
				})
				.seq(function() {
					var self = this;
					Category.update({
						_id: _id
					}, {
						$set: reqData
					}, function(err, ct) {
						if (err) {
							return handleError(res, err);
						}
						console.log(ct);
						self();
					});
				})
				.seq(function() {
					var self = this;
					Brand.update({
						"category._id": _id
					}, {
						$set: {
							group: reqData.group,
							"category.name": reqData.name
						}
					}, {
						multi: true
					}, function(err, br) {
						if (err) {
							return handleError(res, err);
						}
						self();
					});
				})
				.seq(function() {
					var self = this;
					Model.update({
						"category._id": _id
					}, {
						$set: {
							group: reqData.group,
							"category.name": reqData.name
						}
					}, {
						multi: true
					}, function(err, br) {
						if (err) {
							return handleError(res, err);
						}
						res.status(200).send(type + " updated successfully");
					});

				})


			Product.find({
				"category._id": _id
			}, function(err, res) {
				if (err) {
					return handleError(res, err);
				}
				res.forEach(function(x) {

					x.category = {
						"_id": _id,
						name: reqData.name
					};
					x.name = reqData.name + x.brand.name + x.model.name + ((x.variant && x.variant.name) || " ");
					Product.update({
						"_id": x._id
					}, {
						$set: {
							"category": x.category,
							"name": x.name
						}
					}, function(err, updt) {
						if (err) {
							return handleError(res, err);
						}
						console.log(updt);
					})
				})

			});

			break;
		case "Brand":
			Seq()
				.seq(function() {
					var self = this;
					var filter = {};
					filter["name"] = {
						$regex: new RegExp("^" + reqData.name + "$", 'i')
					};
					filter["group.name"] = {
						$regex: new RegExp("^" + reqData.group.name + "$", 'i')
					};
					filter["category.name"] = {
						$regex: new RegExp("^" + reqData.category.name + "$", 'i')
					};
					var query = Brand.find(filter);
					query.exec(function(err, gps) {
						if (err) {
							return handleError(res, err);
						}
						if (gps.length > 0 && gps[0]._id != _id) {
							return res.status(400).send("Brand already exist.");
						}
						self();
					})
				})
				.seq(function() {
					var self = this;
					Brand.update({
						_id: _id
					}, {
						$set: reqData
					}, function(err, br) {
						if (err) {
							return handleError(res, err);
						}
						self();
					});
				})
				.seq(function() {
					var self = this;
					Model.update({
						"brand._id": _id
					}, {
						$set: {
							group: reqData.group,
							category: reqData.category,
							"brand.name": reqData.name
						}
					}, {
						multi: true
					}, function(err, md) {
						if (err) {
							return handleError(res, err);
						}
						res.status(200).send(type + " updated successfully");
					});

				})

			Product.find({
				"brand._id": _id
			}, function(err, res) {
				if (err) {
					return handleError(res, err);
				}
				console.log(res);
				res.forEach(function(x) {

					x.brand = {
						"_id": _id,
						name: reqData.name
					};
					x.name = x.category.name + reqData.name + x.model.name + ((x.variant && x.variant.name) || " ");
					Product.update({
						"_id": x._id
					}, {
						$set: {
							"brand": x.brand,
							"name": x.name
						}
					}, function(err, updt) {
						if (err) {
							return handleError(res, err);
						}
						console.log(updt);
					})
				})

			});

			break;
		case "Model":
			Seq()
				.seq(function() {
					var self = this;
					var filter = {};
					filter["name"] = {
						$regex: new RegExp("^" + reqData.name + "$", 'i')
					};
					filter["brand.name"] = {
						$regex: new RegExp("^" + reqData.brand.name + "$", 'i')
					};
					filter["group.name"] = {
						$regex: new RegExp("^" + reqData.group.name + "$", 'i')
					};
					filter["category.name"] = {
						$regex: new RegExp("^" + reqData.category.name + "$", 'i')
					};
					var query = Model.find(filter);
					query.exec(function(err, gps) {
						if (err) {
							return handleError(res, err);
						}
						if (gps.length > 0 && gps[0]._id != _id) {
							return res.status(400).send("Model already exist.");
						}
						self();
					})
				})
				.seq(function() {
					Model.update({
						_id: _id
					}, {
						$set: reqData
					}, function(err, md) {
						if (err) {
							return handleError(res, err);
						}
						res.status(200).send(type + " updated successfully");
					});
				});

			Product.find({
				"model._id": _id
			}, function(err, res) {
				if (err) {
					return handleError(res, err);
				}
				res.forEach(function(x) {

					x.model = {
						"_id": _id,
						name: reqData.name
					};
					x.name = x.category.name + x.brand.name + reqData.name + ((x.variant && x.variant.name) || " ");
					Product.update({
						"_id": x._id
					}, {
						$set: {
							"model": x.model,
							"name": x.name
						}
					}, function(err, updt) {
						if (err) {
							return handleError(res, err);
						}
						console.log(updt);
					})
				})

			});

			break;
		default:
			return res.status(400).send("Invalid request");
	}

}

exports.deleteMasterData = function(req, res) {
	var reqData = req.body;
	var filter = {};
	switch (reqData.type) {
		case "Group":
			filter['group._id'] = reqData._id;
			checkProductExistence(req, res, filter, checkCategoryExistence);
			break;
		case "Category":
			filter['category._id'] = reqData._id;
			checkProductExistence(req, res, filter, checkBrandExistence);
			break;
		case "Brand":
			filter['brand._id'] = reqData._id;
			checkProductExistence(req, res, filter, checkModelExistence);
			break;
		case "Model":
			filter['model._id'] = reqData._id;
			checkProductExistence(req, res, filter, deleteMasterData);
			break;
		default:
			return res.status(400).send("Invalid request");
	}
}

function checkProductExistence(req, res, filter, next) {
	filter.deleted = false;
	Product.find(filter, function(err, products) {
		if (err) return handleError(res, err);
		else if (products.length > 0) {
			return res.status(400).send("Product is associated.Please delete product first");
		} else {
			delete filter.deleted;
			next(req, res, filter);
		}
	});
}

function checkCategoryExistence(req, res, filter, next) {
	Category.find(filter, function(err, categories) {
		if (err) return handleError(res, err);
		else if (categories.length > 0) {
			return res.status(400).send("Category is associated.Please delete category first");
		} else {
			deleteMasterData(req, res);
		}
	});
}

function checkBrandExistence(req, res, filter, next) {
	Brand.find(filter, function(err, brands) {
		if (err) return handleError(res, err);
		else if (brands.length > 0) {
			return res.status(400).send("Brand is associated.Please delete brand first");
		} else {
			deleteMasterData(req, res);
		}
	});
}

function checkModelExistence(req, res, filter, next) {
	Model.find(filter, function(err, models) {
		if (err) return handleError(res, err);
		else if (models.length > 0) {
			return res.status(400).send("Model is associated.Please delete model first");
		} else {
			deleteMasterData(req, res);
		}
	});
}

function deleteMasterData(req, res) {
	var reqData = req.body;
	var type = req.body.type;
	var _id = req.body._id;
	var modelRef = null;
	switch (type) {
		case "Group":
			modelRef = Group;
			break;
		case "Category":
			modelRef = Category;
			break;
		case "Brand":
			modelRef = Brand;
			break;
		case "Model":
			modelRef = Model;
			break;
	}
	modelRef.remove({
		_id: _id
	}, function(err, data) {
		if (err) {
			return handleError(res, err);
		} else
			res.status(200).send(type + " deleted successfully");

	});
}

exports.exportMasterData = function(req, res) {
	var level = req.body.level;
	var collectionRef = null;
	if (level == 'category')
		collectionRef = Category;
	else
		collectionRef = Model;
	collectionRef.find({}, function(err, data) {
		if (err) {
			return handleError(res, err)
		} else {
			var ws_name = "masterData"
			var wb = new Workbook();
			var ws = excel_from_data(data, level);
			wb.SheetNames.push(ws_name);
			wb.Sheets[ws_name] = ws;
			var wbout = xslx.write(wb, {
				bookType: 'xlsx',
				bookSST: true,
				type: 'binary'
			});
			res.end(wbout);
		}
	});
}

function Workbook() {
	if (!(this instanceof Workbook)) return new Workbook();
	this.SheetNames = [];
	this.Sheets = {};
}

function datenum(v, date1904) {
	if (date1904) v += 1462;
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function setType(cell) {
	if (typeof cell.v === 'number')
		cell.t = 'n';
	else if (typeof cell.v === 'boolean')
		cell.t = 'b';
	else if (cell.v instanceof Date) {
		cell.t = 'n';
		cell.z = xslx.SSF._table[14];
		cell.v = datenum(cell.v);
	} else cell.t = 's';
}

function excel_from_data(data, level) {
	var ws = {};
	var range;
	if (level == 'category')
		range = {
			s: {
				c: 0,
				r: 0
			},
			e: {
				c: 2,
				r: data.length
			}
		};
	else
		range = {
			s: {
				c: 0,
				r: 0
			},
			e: {
				c: 4,
				r: data.length
			}
		};

	for (var R = 0; R != data.length + 1; ++R) {
		var C = 0;
		var dt = null;
		if (R != 0)
			dt = data[R - 1];
		var cell = null;
		if (R == 0)
			cell = {
				v: "Product_Group"
			};
		else {
			if (dt)
				cell = {
					v: dt.group.name
				};
		}
		setType(cell);
		var cell_ref = xslx.utils.encode_cell({
			c: C++,
			r: R
		})
		ws[cell_ref] = cell;

		if (R == 0)
			cell = {
				v: "Product_Category"
			};
		else {
			if (dt) {
				if (level == 'category')
					cell = {
						v: dt.name
					};
				else {
					cell = {
						v: dt.category.name
					};
				}
			}
		}
		setType(cell);
		var cell_ref = xslx.utils.encode_cell({
			c: C++,
			r: R
		})
		ws[cell_ref] = cell;
		if (level == 'category')
			continue;

		if (R == 0)
			cell = {
				v: "Brand_Name"
			};
		else {
			if (dt)
				cell = {
					v: dt.brand.name
				};
		}
		setType(cell);
		var cell_ref = xslx.utils.encode_cell({
			c: C++,
			r: R
		})
		ws[cell_ref] = cell;

		if (R == 0)
			cell = {
				v: "Model_No"
			};
		else {
			if (dt)
				cell = {
					v: dt.name
				};
		}
		setType(cell);
		var cell_ref = xslx.utils.encode_cell({
			c: C++,
			r: R
		})
		ws[cell_ref] = cell;
	}
	ws['!ref'] = xslx.utils.encode_range(range);
	return ws;
}

exports.importMasterData = function(req, res) {
	var fileName = req.body.fileName;
	var workbook = null;
	try {
		workbook = xslx.readFile(importPath + fileName);
	} catch (e) {
		console.log(e);
		return handleError(res, "Error in file upload")
	}
	if (!workbook)
		return res.status(404).send("Error in file upload");
	var worksheet = workbook.Sheets[workbook.SheetNames[0]];
	//console.log("data",worksheet);
	var data = xslx.utils.sheet_to_json(worksheet);
	if (data.length == 0) {
		return res.status(500).send("There is no data in the file.");
	}
	var hd = getHeaders(worksheet);
	if (!validateHeader(hd, MASTER_DATA_HEADER)) {
		return res.status(500).send("Wrong template");
	}
	//console.log("data",data);
	req.counter = 0;
	req.numberOfCount = data.length;
	req.successCount = 0;
	importData(req, res, data);
}


var MASTER_DATA_HEADER = ["Product_Group", "Product_Category", "Brand_Name", "Model_No"];

function validateHeader(headersInFile, headers) {
	var ret = true;
	ret = headersInFile.length == headers.length;
	if (!ret)
		return ret;
	for (var i = 0; i < headersInFile.length; i++) {
		var hd = headers[i];
		if (headersInFile.indexOf(hd) == -1) {
			ret = false;
			break;
		}
	}

	return ret;
}



function getHeaders(worksheet) {
	var headers = [];
	for (var z in worksheet) {
		if (z[0] === '!') continue;
		//parse out the column, row, and value
		var col = z.substring(0, 1);
		var row = parseInt(z.substring(1));
		var value = worksheet[z].v;
		//store header names
		if (row == 1) {
			headers[headers.length] = value;
		}
	}
	console.log("gggg", headers);
	return headers;
}

function importData(req, res, data) {
	if (req.counter < req.numberOfCount) {
		var row = data[req.counter];
		var groupName = trim(row["Product_Group"] || "").toLowerCase();
		var categoryName = trim(row["Product_Category"] || "").toLowerCase();
		var modelName = trim(row["Model_No"] || "").toLowerCase();
		var brandName = trim(row["Brand_Name"] || "").toLowerCase();
		var isValid = true;
		if (groupName == "other" || categoryName == "other" || modelName == "other" || brandName == "other")
			isValid = false;
		if (!isValid) {
			req.counter++;
			importData(req, res, data)
			return;
		}
		req.data = {};
		upsertGroup(req, res, data);

	} else {
		res.status(200).send(req.successCount + " out of " + req.numberOfCount + " records processed");
	}
}

function upsertGroup(req, res, data) {
	var row = data[req.counter];
	var groupName = trim(row["Product_Group"] || "");
	if (!groupName) {
		req.counter++;
		importData(req, res, data)
		return;
	}
	req.successCount++;
	var groupObj = req.data.group = {};
	Seq().
	seq(function() {
			var self = this;
			var term = new RegExp("^" + groupName + "$", 'i');
			Group.find({
				name: term
			}, function(err, groups) {
				if (err) return handleError(res, err);
				if (groups.length > 0) {
					groupObj['_id'] = groups[0]['_id'] + "";
					groupObj['name'] = groupName;
					upsertCategory(req, res, data);
				} else {
					self();
				}
			})

		})
		.seq(function() {
			var self = this;
			var gpObject = {};
			gpObject['name'] = groupName;
			gpObject.createdAt = new Date();
			gpObject.updatedAt = new Date();
			Group.create(gpObject, function(err, gp) {
				if (err) return handleError(res, err);
				groupObj['_id'] = "" + gp['_id'];
				groupObj['name'] = groupName;
				upsertCategory(req, res, data);
			})
		})
}

function upsertCategory(req, res, data) {
	var row = data[req.counter];
	var categoryName = trim(row["Product_Category"] || "");
	if (!categoryName) {
		req.counter++;
		importData(req, res, data)
		return;
	}
	var categoryObj = req.data.category = {};
	Seq().
	seq(function() {
			var self = this;
			var term = new RegExp("^" + categoryName + "$", 'i');
			var gpTerm = new RegExp("^" + req.data.group.name + "$", 'i');
			Category.find({
				name: term,
				"group.name": gpTerm
			}, function(err, categories) {
				if (err) return handleError(res, err);
				if (categories.length > 0) {
					categoryObj['_id'] = categories[0]['_id'] + "";
					categoryObj['name'] = categoryName;
					upsertBrand(req, res, data);
				} else {
					self();
				}
			})

		})
		.seq(function() {
			var self = this;
			var catObj = {};
			catObj['name'] = categoryName;
			catObj.createdAt = new Date();
			catObj.updatedAt = new Date();
			catObj.group = req.data.group;
			catObj['status'] = false;
			catObj['deleted'] = false;
			Category.create(catObj, function(err, cat) {
				if (err) return handleError(res, err);
				categoryObj['_id'] = cat['_id'] + "";
				categoryObj['name'] = categoryName;
				upsertBrand(req, res, data);
			})
		})
}

function upsertBrand(req, res, data) {
	var row = data[req.counter];
	var brandName = trim(row["Brand_Name"] || "");
	if (!brandName) {
		req.counter++;
		importData(req, res, data)
		return;
	}
	var brandObj = req.data.brand = {};
	Seq().
	seq(function() {
			var self = this;
			var term = new RegExp("^" + brandName + "$", 'i');
			var gpTerm = new RegExp("^" + req.data.group.name + "$", 'i');
			var catTerm = new RegExp("^" + req.data.category.name + "$", 'i');
			Brand.find({
				name: term,
				'group.name': gpTerm,
				'category.name': catTerm
			}, function(err, brands) {
				if (err) return handleError(res, err);
				if (brands.length > 0) {
					brandObj['_id'] = brands[0]['_id'] + "";
					brandObj['name'] = brandName;
					upsertModel(req, res, data);
				} else {
					self();
				}
			})

		})
		.seq(function() {
			var self = this;
			var brObj = {};
			brObj['name'] = brandName;
			brObj.createdAt = new Date();
			brObj.updatedAt = new Date();
			brObj.group = req.data.group;
			brObj.category = req.data.category;
			Brand.create(brObj, function(err, brd) {
				if (err) return handleError(res, err);
				brandObj['_id'] = brd['_id'] + "";
				brandObj['name'] = brandName;
				upsertModel(req, res, data);
			})
		})
}

function upsertModel(req, res, data) {
	var row = data[req.counter];
	var modelName = trim(row["Model_No"] || "");
	if (!modelName) {
		req.counter++;
		importData(req, res, data)
		return;
	}
	var modelObj = req.data.model = {};
	Seq().
	seq(function() {
			var self = this;
			var term = new RegExp("^" + modelName + "$", 'i');
			var brTerm = new RegExp("^" + req.data.brand.name + "$", 'i');
			var gpTerm = new RegExp("^" + req.data.group.name + "$", 'i');
			var catTerm = new RegExp("^" + req.data.category.name + "$", 'i');
			Model.find({
				name: term,
				'category.name': catTerm,
				"group.name": gpTerm,
				"brand.name": brTerm
			}, function(err, models) {
				if (err) return handleError(res, err);
				if (models.length > 0) {
					req.counter++;
					importData(req, res, data)

				} else {
					self();
				}
			})
		})
		.seq(function() {
			var self = this;
			var mdObj = {};
			mdObj['name'] = modelName;
			mdObj.createdAt = new Date();
			mdObj.updatedAt = new Date();
			mdObj.group = req.data.group;
			mdObj.category = req.data.category;
			mdObj.brand = req.data.brand;
			Model.create(mdObj, function(err, md) {
				if (err) return handleError(res, err);
				req.counter++;
				//req.successCount ++;
				importData(req, res, data)

			})
		})
}

function buildSuggestion(req, res, suggestions) {
	if (req.counter >= suggestions.length)
		return res.status(200).json({});
	else {
		var data = suggestions[req.counter];
		SearchSuggestion.find({
			text: data.text
		}, function(err, result) {
			if (err) {
				console.log("error in checking suggestion", err);
				req.counter++;
				buildSuggestion(req, res, suggestions);
			}
			if (result && result.length > 0) {
				console.log("recalled called ", result.length);
				req.counter++;
				buildSuggestion(req, res, suggestions);

			} else {
				console.log("called create", result.length);
				SearchSuggestion.create(data, function(error, dt) {
					if (error) console.log("error in building suggestion", error);
					req.counter++;
					buildSuggestion(req, res, suggestions);
				});
			}

		});
	}
}

exports.rotate = function(req, res) {
	var imgPath = config.uploadPath + req.body.imgPath;
    lwip.open(imgPath,function(err,image){
     	if(err)
     		throw err;

     	image.batch()
	    .rotate(-90,"white")
		.writeFile(imgPath, function(e) {
			if (e) {
				throw e;
			} else
				res.send("done");
		}); 	
    })
	// image.batch()
	/*gm(config.uploadPath + imgPath)
=======
     	image.batch().rotate(-90,"white")
			.writeFile(imgPath, function(e) {
				if (e) {
					throw e;
				} else{
					res.send("done");
				}
			}); 	
    })
	/*var imgPath = req.body.imgPath;
	gm(config.uploadPath + imgPath)
>>>>>>> d3c20c5957f1b55aa6716bb4391562ba723bc84b
		.rotate("white", -90)
		.write(config.uploadPath + imgPath, function(e) {
			if (e) {
				return handleError(res, e);
			} else
				res.send("done");
		});*/
}

exports.saveAsImage = function(req, res) {
	var fileName = req.body.filename;
	var assetDir = req.body.assetdir;
	var fileNameParts = fileName.split('.');
	var extPart = fileNameParts[fileNameParts.length - 1];
	var namePart = fileNameParts[0];
	var originalFilePath = config.uploadPath + assetDir + "/" + namePart + "_original." + extPart;
	var filePath = config.uploadPath + assetDir + "/" + fileName;
	if (fileExists(originalFilePath)) {

		saveImage(req, res, filePath, extPart);
	} else {

		fsExtra.copy(filePath, originalFilePath, function(err, result) {
			console.log("-----------", err);
			saveImage(req, res, filePath, extPart);
		})

	}

}

function saveImage(req, res, filePath, ext) {
	var fileData = req.body.data;
	var imgExt = ext.toLowerCase();
	var regEx = "";
	if (imgExt == "jpeg" || imgExt == "jpg")
		regEx = /^data:image\/jpeg;base64,/;
	else if (imgExt == "png")
		regEx = /^data:image\/png;base64,/;
	else
		return handleError(res, {});
	var base64Data = fileData.replace(regEx, "");
	fs.writeFile(filePath, base64Data, "base64", function(err) {
		if (err) {
			console.log("-----------", err);
			res.status(500).send(err);
		} else {
			res.status(200).send(err);
		}
	});
}

function fileExists(filePath) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (err) {
		return false;
	}
}

//subscriber

exports.getAllSubscriber = function(req, res) {
	Subscribe.find(function(err, subscribers) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(subscribers);
	});
};

exports.createSubscribe = function(req, res) {
	req.body.createdAt = new Date();
	var filter = {};
	filter["email"] = req.body.email;
	Subscribe.find(filter, function(err, subscriber) {
		if (err) {
			return handleError(res, err);
		} else {
			if (subscriber.length > 0) {
				return res.status(201).json({
					errorCode: 1,
					message: "This email ID is already registered. Please enter different email ID for new subscription."
				});
			} else {
				Subscribe.create(req.body, function(err, subscriber) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						errorCode: 0,
						message: "Thanks for subscribing to our Newsletter!"
					});
				});
			}

		}

	});
};


//location functions

// Get list of Country
exports.getAllCountry = function(req, res) {
	Country.find({}).sort({
		name: 1
	}).exec(function(err, country) {
		if (err) {
			return handleError(res, err);
		}
		res.setHeader('Cache-Control', 'private, max-age=2592000');
		return res.status(200).json(country);
	});
};

// Creates a new state in the DB.
exports.createCountry = function(req, res) {
	req.body.createdAt = new Date();
	req.body.updatedAt = req.body.createdAt;
	var filter = {};
	var arr = [];
	if (req.body.name)
		arr[arr.length] = {
			name: req.body.name
		};
	if (req.body.countryCode)
		arr[arr.length] = {
			countryCode: req.body.countryCode
		};

	if (arr.length > 0)
		filter['$or'] = arr;
	//console.log("filter###", filter);
	Country.find(filter, function(err, country) {
		if (err) {
			return handleError(res, err);
		} else {
			if (country.length > 0) {
				return res.status(201).json({
					errorCode: 1,
					message: "Country or Code already exits!!!"
				});
			} else {
				Country.create(req.body, function(err, resulst) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						errorCode: 0,
						message: "Country save sucessfully"
					});
				});
			}

		}

	});

};
// Updates an existing country in the DB.
exports.updateCountry = function(req, res) {
	if (req.body._id) {
		delete req.body._id;
	}
	req.body.updatedAt = new Date();
	Country.findById(req.params.id, function(err, country) {
		if (err) {
			return handleError(res, err);
		}
		if (!country) {
			return res.status(404).send('Not Found');
		}
		Country.update({
			_id: req.params.id
		}, {
			$set: req.body
		}, function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json(req.body);
		});
	});
};

// Deletes a country from the DB.
exports.deleteCountry = function(req, res) {
	State.find({
		country: req.params.name
	}, function(err, states) {
		if (err) {
			return handleError(res, err);
		}
		if (states && states.length > 0) {
			return res.status(200).json({
				errorCode: 1,
				message: 'States are associated with this country'
			});
		} else
			deleteCountry(req, res);
	})
};

function deleteCountry(req, res) {
	Country.findById(req.params.id, function(err, country) {
		if (err) {
			return handleError(res, err);
		}
		if (!country) {
			return res.status(404).send('Country Not Found');
		}
		country.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).json({
				message: "Country deleted sucessfully!!!"
			});
		});
	});
}

// Get list of State
exports.getAllState = function(req, res) {
	State.find().sort({
		name: 1
	}).exec(function(err, st) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(st);
	});
};


// Creates a new state in the DB.
exports.createState = function(req, res) {
	req.body.createdAt = new Date();
	req.body.updatedAt = req.body.createdAt;
	var filter = {};
	filter["name"] = req.body.name;
	State.find(filter, function(err, sts) {
		if (err) {
			return handleError(res, err);
		} else {
			if (sts.length > 0) {
				return res.status(201).json({
					message: "State already exits!!!"
				});
			} else {
				State.create(req.body, function(err, st) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						message: "State save sucessfully"
					});
				});
			}

		}

	});

};
// Updates an existing state in the DB.
exports.updateState = function(req, res) {
	if (req.body._id) {
		delete req.body._id;
	}
	if (req.body.user) {
		delete req.body.user;
	}
	req.body.updatedAt = new Date();
	State.findById(req.params.id, function(err, st) {
		if (err) {
			return handleError(res, err);
		}
		if (!st) {
			return res.status(404).send('Not Found');
		}
		State.update({
			_id: req.params.id
		}, {
			$set: req.body
		}, function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json(req.body);
		});
	});
};

// Deletes a state from the DB.
exports.deleteState = function(req, res) {
	City.find({
		'state._id': req.params.id
	}, function(err, cities) {
		if (err) {
			return handleError(res, err);
		}
		if (cities && cities.length > 0) {
			return res.status(200).json({
				errorCode: 1,
				message: 'Cities are associated with this state'
			});
		} else
			deleteState(req, res);
	})
};

function deleteState(req, res) {
	State.findById(req.params.id, function(err, st) {
		if (err) {
			return handleError(res, err);
		}
		if (!st) {
			return res.status(404).send('State Not Found');
		}
		st.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).json({
				message: "State deleted sucessfully!!!"
			});
		});
	});
}
// Get list of city
exports.getAllCity = function(req, res) {
	var query = City.find({}).sort({
		name: 1
	});
	query.exec(function(err, ct) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(ct);
	});
};


// Creates a new city in the DB.
exports.createCity = function(req, res) {
	req.body.createdAt = new Date();
	req.body.updatedAt = req.body.createdAt;
	var filter = {};
	filter["name"] = req.body.name;
	City.find(filter, function(err, cts) {
		if (err) {
			return handleError(res, err);
		} else {
			if (cts.length > 0) {
				return res.status(201).json({
					message: "City already exits!!!"
				});
			} else {
				City.create(req.body, function(err, ct) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						message: "City save sucessfully"
					});
				});
			}

		}

	});

};
// Updates an existing city in the DB.
exports.updateCity = function(req, res) {
	if (req.body._id) {
		delete req.body._id;
	}
	if (req.body.user) {
		delete req.body.user;
	}
	req.body.updatedAt = new Date();
	City.findById(req.params.id, function(err, ct) {
		if (err) {
			return handleError(res, err);
		}
		if (!ct) {
			return res.status(404).send('Not Found');
		}
		City.update({
			_id: req.params.id
		}, {
			$set: req.body
		}, function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json(req.body);
		});
	});
};

// Deletes a city from the DB.
exports.deleteCity = function(req, res) {
	City.findById(req.params.id, function(err, ct) {
		if (err) {
			return handleError(res, err);
		}
		if (!ct) {
			return res.status(404).send('City Not Found');
		}
		ct.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).send({
				message: "City deleted sucessfully!!!"
			});
		});
	});
};

exports.searchCity = function(req, res) {
	var filter = {};

	if (req.body.searchStr) {
		var term = new RegExp(req.body.searchStr, 'i');
		filter['name'] = {
			$regex: term
		};
	}

	if (req.body.cityName)
		filter['name'] = req.body.cityName;

	if (req.body.country)
		filter['state.country'] = req.body.country;

	if (req.body.stateName)
		filter['state.name'] = req.body.stateName;
	var query = City.find(filter);
	query.exec(
		function(err, ct) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json(ct);
		}
	);
}

exports.searchLocation = function(req, res) {
	var filter = {};
	if (!req.body.searchStr)
		return res.status(200).json([]);
	if (req.body.searchStr) {
		var term = new RegExp(req.body.searchStr, 'i');
		filter['name'] = {
			$regex: term
		};
	}
	var countryQry = Country.find(filter);
	var cityQry = City.find(filter);
	var stateQry = State.find(filter);

	cityQry.exec(
		function(err, ctArr) {
			if (err) {
				return handleError(res, err);
			}
			stateQry.exec(function(err, stArr) {
				if (err) {
					return handleError(res, err);
				}
				countryQry.exec(function(err, coArr) {
					if (err) {
						return handleError(res, err);
					}
					var finalArr = ctArr.concat(stArr).concat(coArr);
					return res.status(200).json(finalArr);
				})
			})
		});
}

exports.searchState = function(req, res) {
	var filter = {};
	// if(!req.body.searchStr)
	// 	res.status(200).json([]);

	if (req.body.searchStr) {
		var term = new RegExp(req.body.searchStr, 'i');
		filter['name'] = {
			$regex: term
		};
	}

	if (req.body.country)
		filter['country'] = req.body.country;

	//var cityQry = City.find(filter);
	var stateQry = State.find(filter);

	stateQry.exec(function(err, stArr) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(stArr);
	})

}

/*exports.searchCities = function(req,res){
  


  var filter = {};
  if(!req.body.searchStr)
  	res.status(200).json([]);
  
    	console.log(filter);

  if(req.body.searchStr){
    var term = new RegExp(req.body.searchStr, 'i');
    filter['name'] = {$regex:term};
  }

  if(req.body.state){
  	filter['state.name']=req.body.state;
  	}

  var cityQry = City.find(filter);

       cityQry.exec(function (err, ctArr) {
	    if(err) { return handleError(res, err); }
	    return res.status(200).json(ctArr);
   })
}*/



function validateData(data) {
	var err = ['country', 'state', 'location', 'countryCode'].filter(function(x) {
		if (!data[x])
			return x;
	});
	return err;
}

exports.importLocation = function(req, res, next) {
	var fileName = req.body.fileName;
	var user = req.body.user;
	//var user = req.body.user;
	//var type = req.query.type || 'technical';
	//console.log("I am here",fileName);

	//debug(user);
	var workbook = null;
	try {
		workbook = xslx.readFile(importPath + fileName);
	} catch (e) {
		
		//debug(e);
		return next(new APIError(400, 'Error while parsing excel sheet'));
	}

	if (!workbook)
		return next(new APIError(404, 'No Excel sheet found for upload'));

	var worksheet = workbook.Sheets[workbook.SheetNames[0]];

	var data = xslx.utils.sheet_to_json(worksheet);

	//console.log(data);

	var errObj = [];
	var successCount = 0;
	var totalCount = data.length;
	//console.log("data.length",totalCount);

	var field_map = {
		'Country': 'country',
		'State': 'state',
		'Location': 'location',
		'Country Code': 'countryCode'
	};

	var hd = getHeaders(worksheet);
	var headers = ['Country', 'State', 'Location', 'Country Code']
	if (!validateHeader(hd, headers)) {
		return res.json({message:"Wrong template"});
	}

	var err;

	data = data.filter(function(x) {
		Object.keys(x).forEach(function(key) {
				
				if (field_map[key]) {
					x[field_map[key]] = x[key] && x[key].replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				}
				x.rowCount = x.__rowNum__
					//x.type = type;
				delete x[key];
			})
	    
	 		//console.log("data filter",data);

		err = validateData(x);
		if (err.length)
			errObj.push({
				Error: err.toString(),
				rowCount: x.rowCount
			});
		else
			return x;
	});

	var dupRowNums = data.filter(function(x){
		return x.rowCount;
	});

	data = _.uniq(data,function(e){
		return e.country,e.state,e.location,e.countryCode,e.rowCount;
	});

	data.forEach(function(x){
		dupRowNums.splice(dupRowNums.indexOf(x.rowCount),1);	
	});

	dupRowNums.forEach(function(x){
		errObj.push({
			Error : 'Duplicate Row in excel',
			rowCount : x
		})
	});
	



	if (!data.length) {
		return res.json({
			errObj: errObj,
			message: 'No data found for upload,error has been sent to your email id'
		});
	}

    

	async.forEachLimit(data, 5, intialize, finalize);

	function intialize(info, cb) {

		info.user = user;
		var query = {
			name: info.country
		}
		var stateObj = {
			name: info.state,
			country: info.country,
			user: info.user
		}

		async.series([fetchCountries,fetchState,fetchLocation],insertData);

		function fetchCountries(callback){
			Country.find(query, function(err, countries) {
				if (err || !countries)
					return callback(err ||'Error while fetching countries');
				
				if(!countries.length){
					Country.create({name:info.country,countryCode:info.countryCode},function(err,resp){
						if(err || !resp)
							return callback(err || 'Error while creating new country');
						return callback();
					})
				} else {
					return callback();
				}
				
			})
		}

		function fetchState(callback){
			State.find({name : info.state,country:info.country}, function(err, states) {
				if (err || !states)
					return callback(err || 'Error while fetching states');
				
				if(!states.length){
					State.create({name:info.state,country:info.country},function(err,resp){
						if(err || !resp)
							return callback(err || 'Error while creating new state');
						return callback();
					})
				} else {
					return callback();
				}
			})
		}

		function fetchLocation(callback){
			City.find({name : info.location,"state.name":stateObj.name,"state.country":stateObj.country}, function(err, cities) {
				if (err || !cities)
					return callback(err || 'Error while fetching countries');
				
				if(cities.length)
					return callback(('Duplicate entry'));
				else{
					City.create({name:info.location,state:stateObj},function(err,resp){
						if(err || !resp)
							return callback(err || 'Error while creating new city');
						successCount++;
						return callback();
					})
				}
			})
		}

		function insertData(err){
			if(err){
				errObj.push({
					Error : err,
					rowCount : info.rowCount
				});
			}

			return cb();
		}

	}

	function finalize(err) {
		return res.json({
			errObj: errObj,
			message: successCount +' '+ 'records uploaded successfully' 
		});
	}
}

exports.searchAssetId = function(req, res) {

		var filter = {};
		if (!req.body.searchStr)
			res.status(200).json([]);
		if (req.body.searchStr) {
			var term = new RegExp(req.body.searchStr, 'i');
			filter['assetId'] = {
				$regex: term
			};
		}
		var proQry = Product.find(filter);

		proQry.exec(
			function(err, ptArr) {
				if (err) {
					return handleError(res, err);
				}
				return res.status(200).json(ptArr);
			});
	}
	// save search

// Get a single user save search
exports.getOnId = function(req, res) {
	console.log("getOnId search", req.params.id);
	SavedSearch.find({
		'user._id': req.params.id
	}, function(err, searchData) {
		if (err) {
			return handleError(res, err);
		}
		if (!searchData) {
			return res.status(404).send('Not Found');
		}
		return res.json(searchData);
	});
};

// Creates a new search in the DB.
exports.createSearch = function(req, res) {
	req.body.createdAt = new Date();
	req.body.updatedAt = new Date();
	var filter = {};
	filter["user._id"] = req.body.user._id;
	filter["filter.category"] = req.body.filter.category;
	console.log("filterSearch", filter);

	SavedSearch.find(filter, function(err, searchData) {
		if (err) {
			return handleError(res, err);
		} else {
			if (searchData.length > 0) {
				return res.status(200).json({
					errorCode: 1,
					message: "Search already exits!!!"
				});
			} else {
				SavedSearch.create(req.body, function(err, searchData) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						errorCode: 0,
						message: "Search save sucessfully"
					});
				});
			}

		}

	});

};
// Updates an existing search in the DB.
exports.updateSaveSearch = function(req, res) {
	if (req.body._id) {
		delete req.body._id;
	}
	if (req.body.user) {
		delete req.body.user;
	}
	req.body.updatedAt = new Date();
	SavedSearch.findById(req.params.id, function(err, searchData) {
		if (err) {
			return handleError(res, err);
		}
		if (!searchData) {
			return res.status(404).send('Not Found');
		}
		SavedSearch.update({
			_id: req.params.id
		}, {
			$set: req.body
		}, function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json(req.body);
		});
	});
};

// Deletes a save search from the DB.
exports.deleteSaveSearch = function(req, res) {
	SavedSearch.findById(req.params.id, function(err, searchData) {
		if (err) {
			return handleError(res, err);
		}
		if (!searchData) {
			return res.status(404).send('Search Not Found');
		}
		searchData.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).send({
				message: "Search deleted sucessfully!!!"
			});
		});
	});
};


// Get list of Payment Master
exports.getPaymentMaster = function(req, res) {
	PaymentMaster.find(function(err, pym) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(pym);
	});
};


// Create a new payment master in the DB.
exports.createPaymentMaster = function(req, res) {

	req.body.createdAt = new Date();
	req.body.updatedAt = req.body.createdAt;
	var filter = {};
	filter["serviceCode"] = req.body.serviceCode;
	if (req.body.multiple == 'y')
		filter["partnerId"] = req.body.partnerId;
	PaymentMaster.find(filter, function(err, pyms) {
		if (err) {
			return handleError(res, err);
		} else {
			console.log(pyms);
			if (pyms.length > 0) {
				return res.status(201).json({
					errorCode: 1,
					message: "Payment Master already exits!!!"
				});
			} else {
				PaymentMaster.create(req.body, function(err, st) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						errorCode: 0,
						message: "Payment master saved sucessfully"
					});
				});
			}

		}

	});

};
// Updates an existing payment master in the DB.
exports.updatePaymentMaster = function(req, res) {
	if (req.body._id) {
		delete req.body._id;
	}
	req.body.updatedAt = new Date();
	var filter = {};
	filter['serviceCode'] = req.body.serviceCode;
	if (req.body.multiple == 'y')
		filter["partnerId"] = req.body.partnerId;
	console.log("dgdhd", filter);
	PaymentMaster.find({
		_id: req.params.id
	}, function(err, pyms) {
		if (err) {
			return handleError(res, err);
		}
		if (pyms.length == 0) {
			return res.status(404).send('Not Found');
		} else if (pyms.length > 1) {
			return res.status(201).send({
				errorCode: 1,
				message: 'Payment Master already exist.'
			});
		} else if (pyms[0]._id != req.params.id) {
			return res.status(201).send({
				errorCode: 1,
				message: 'Payment Master already exist.'
			});
		}
		PaymentMaster.update({
			_id: req.params.id
		}, {
			$set: req.body
		}, function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).send({
				errorCode: 0,
				message: 'Payment Master updated successfully.'
			});
		});
	});
};

// Deletes a state from the DB.
exports.deletePaymentMaster = function(req, res) {
	PaymentMaster.findById(req.params.id, function(err, paymentData) {
		if (err) {
			return handleError(res, err);
		}
		if (!paymentData) {
			return res.status(404).send('Payment master Found');
		}
		paymentData.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).send({
				errorCode: 0,
				message: "Payment master deleted sucessfully!!!"
			});
		});
	});
};

// Get list of manufacturer
exports.getAllManufacturer = function(req, res) {
	ManufacturerMaster.find(function(err, manufacturer) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(manufacturer);
	});
};


// Creates a new manufacturer in the DB.
exports.createManufacturer = function(req, res) {
	var filter = {};
	filter["name"] = req.body.name;
	ManufacturerMaster.find(filter, function(err, manufacturer) {
		if (err) {
			return handleError(res, err);
		} else {
			if (manufacturer.length > 0) {
				return res.status(201).json({
					errorCode: 1,
					message: "Manufacturer already exits!!!"
				});
			} else {
				ManufacturerMaster.create(req.body, function(err, manufacturer) {
					if (err) {
						return handleError(res, err);
					}
					return res.status(200).json({
						errorCode: 0,
						message: "Manufacturer saved sucessfully"
					});
				});
			}
		}
	});
};

// Updates an existing manufacturer in the DB.
exports.updateManufacturer = function(req, res) {
	var _id = req.body._id;
	if (req.body._id) {
		delete req.body._id;
	}
	req.body.updatedAt = new Date();
	var filter = {}
	if (!req.body.name)
		return res.status(401).send('Insufficient data');
	if (_id)
		filter['_id'] = {
			$ne: _id
		};
	filter['name'] = req.body.name;
	ManufacturerMaster.find(filter, function(err, manufacturer) {
		if (err) return handleError(res, err);
		if (manufacturer.length > 0) {
			return res.status(200).json({
				errorCode: 1,
				message: "Manufacturer already exist."
			});
		} else {
			ManufacturerMaster.update({
				_id: _id
			}, {
				$set: req.body
			}, function(err) {
				if (err) {
					return handleError(res, err);
				}
				return res.status(200).json({
					errorCode: 0,
					message: "Success"
				});
			});
		}
	});
};

// Deletes a manufacturer from the DB.
exports.destroyManufacturer = function(req, res) {
	ManufacturerMaster.findById(req.params.id, function(err, manufacturer) {
		if (err) {
			return handleError(res, err);
		}
		if (!manufacturer) {
			return res.status(404).send('Not Found');
		}
		manufacturer.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).send('No Content');
		});
	});
};

// Get list of banner master
exports.getAllBanner = function(req, res) {
	Banner.find(function(err, banner) {
		if (err) {
			return handleError(res, err);
		}
		return res.status(200).json(banner);
	});
};


// Creates a new banner master in the DB.
exports.createBanner = function(req, res) {
	var seq = req.body.sequence;
	Banner.find({
		sequence: seq
	}, function(errObj, bns) {
		if (errObj) {
			return handleError(res, err);
		}
		if (bns.length > 0) {
			return res.status(200).json({
				errorCode: 1,
				message: "Duplicate sequence find"
			});
		}
		Banner.create(req.body, function(err, banner) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json({
				errorCode: 0,
				message: "Banner saved sucessfully"
			});
		});
	})

};

// Updates an existing banner master in the DB.
exports.updateBanner = function(req, res) {
	if (req.body._id) {
		delete req.body._id;
	}
	req.body.updatedAt = new Date();
	Banner.find({
		sequence: req.body.sequence
	}, function(err, banners) {
		if (err) {
			return handleError(res, err);
		}
		if (banners.length > 1 || (banners.length == 1 && banners[0]._id != req.params.id)) {
			return res.status(200).json({
				errorCode: 1,
				message: "Duplicate sequence find"
			});
		}
		Banner.update({
			_id: req.params.id
		}, {
			$set: req.body
		}, function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(200).json({
				errorCode: 0,
				message: "Banner updated sucessfully"
			});
		});
	});
};

// Deletes a banner master from the DB.
exports.deleteBanner = function(req, res) {
	Banner.findById(req.params.id, function(err, banner) {
		if (err) {
			return handleError(res, err);
		}
		if (!banner) {
			return res.status(404).send('Not Found');
		}
		banner.remove(function(err) {
			if (err) {
				return handleError(res, err);
			}
			return res.status(204).send('No Content');
		});
	});
};

exports.getBannerOnFilter = function(req, res) {
	var bodyData = req.body;
	var filter = {};
	filter['deleted'] = false;
	filter['status'] = "active";
	if (bodyData.valid && bodyData.valid == 'y') {
		filter['eDate'] = {
			$gte: new Date()
		};
		filter['sDate'] = {
			$lte: new Date()
		};
	}

	var query = Banner.find(filter).sort({
		sequence: 1
	});
	query.exec(
		function(err, banners) {
			if (err) {
				return handleError(res, err);
			}
			res.setHeader('Cache-Control', 'private, max-age=2592000');
			return res.status(200).json(banners);
		});
}

exports.renderXLSX = function(req, res) {
	if (req.query.type == "state") {
		var headers = ['Country', 'State'];
		var json = {};
		var xlsxData = [];
		var arr = [];

		State.find(function(err, st) {
			if (err) {
				return handleError(res, err);
			}

			st.forEach(function(x) {
				json = {};
				arr = [];
				arr.push(_.get(x, 'country', ''));
				arr.push(_.get(x, 'name', ''));

				for (var i = 0; i < headers.length; i++) {
					json[headers[i]] = arr[i];
				}

				xlsxData.push(json);
			})

			res.xls('StateList.xlsx', xlsxData);
		});
	} else {
		var headers = ['Country', 'State', 'Location'];
		var json = {};
		var xlsxData = [];
		var arr = [];

		City.find(function(err, st) {
			if (err) {
				return handleError(res, err);
			}

			st.forEach(function(x) {
				json = {};
				arr = [];
				arr.push(_.get(x, 'state.country', ''));
				arr.push(_.get(x, 'state.name', ''));
				arr.push(_.get(x, 'name', ''));

				for (var i = 0; i < headers.length; i++) {
					json[headers[i]] = arr[i];
				}

				xlsxData.push(json);
			})

			res.xls('LocationList.xlsx', xlsxData);
		});
	}
}

function isValid(d) {
	return d.getTime() === d.getTime();
}

function handleError(res, err) {
	console.log(err);
	return res.status(500).send(err);
}