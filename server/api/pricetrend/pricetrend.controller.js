'use strict';

var _ = require('lodash');
var PriceTrend = require('./pricetrend.model');
var PriceTrendSurvey = require('./pricetrendsurvey.model');
var Utility = require('./../../components/utility.js');
var xlsx = require('xlsx');
var config = require('./../../config/environment');
var Seq = require('seq');
var Category = require('./../category/category.model');
var Brand = require('./../brand/brand.model');
var Model = require('./../model/model.model');

var importPath = config.uploadPath + config.importDir + "/";

// Creates a new brand in the DB.
exports.create = function (req, res) {

  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  var filter = {};
  filter["category._id"] = req.body.category._id;
  filter["brand._id"] = req.body.brand._id;
  filter["model._id"] = req.body.model._id;

  filter["mfgYear"] = req.body.mfgYear;
  filter["saleYear"] = req.body.saleYear;

  PriceTrend.find(filter, function (err, trends) {
    if (err) { return handleError(res, err); }
    else if (trends.length > 0) { res.status(201).json({ errorCode: 1, message: "Price trend already exits!!!" }); }
    else {
      PriceTrend.create(req.body, function (err, newTrend) {
        if (err) { return handleError(res, err); }
        return res.status(200).json({ errorCode: 0, message: "Price trend  saved sucessfully" });
      });
    }

  });
};


exports.getPriceTrendOnFilter = function (req, res) {
  var filter = {};
  if (req.body.categoryId)
    filter['category._id'] = req.body.categoryId;
  if (req.body.brandId)
    filter['brand._id'] = req.body.brandId;

  if (req.body.modelId)
    filter['model._id'] = req.body.modelId;

  if (req.body.mfgYear)
    filter['mfgYear'] = req.body.mfgYear;
  if (req.body.saleYear)
    filter['saleYear'] = req.body.saleYear;
  if (req.body.maxSaleYear)
    filter['saleYear'] = { $lte: req.body.maxSaleYear };
  console.log("filter", filter);

  var query = PriceTrend.find(filter).sort({ saleYear: -1 });
  query.exec(function (err, result) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(result);

  })
}

// Updates an existing auction in the DB.
exports.update = function (req, res) {

  if (req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  var filter = {};
  filter["category._id"] = req.body.category._id;
  filter["brand._id"] = req.body.brand._id;
  filter["model._id"] = req.body.model._id;

  filter["mfgYear"] = req.body.mfgYear;
  filter["saleYear"] = req.body.saleYear;

  PriceTrend.find(filter, function (err, prTrends) {
    if (err) { return handleError(res, err); }
    if (prTrends.length > 1) { return res.status(201).json({ errorCode: 1, message: "Duplicate price trend found" }) };
    if (prTrends.length == 1 && prTrends[0]._id != req.params.id) { return res.status(201).json({ errorCode: 1, message: "Duplicate price trend found" }); }
    PriceTrend.update({ _id: req.params.id }, { $set: req.body }, function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json({ errorCode: 0, message: "Price trend updated successfully." });
    });
  });
};

// Deletes a auction from the DB.
exports.destroy = function (req, res) {
  PriceTrend.findById(req.params.id, function (err, pt) {
    if (err) { return handleError(res, err); }
    if (!pt) { return res.status(404).send('Not Found'); }
    pt.remove(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(201).json({ message: "Price trend deleted successfully." });;
    });
  });
};

//data export

var PRICE_TREND_FIELD_MAP = {
  'Category': 'category.name',
  'Brand': 'brand.name',
  'Model': 'model.name',
  'Manufatcuring Year': 'mfgYear',
  'Sale Year': 'saleYear',
  'Excellent Condition - OEM/Dealer Estimation': 'trendValue.oemPrice.excellentCondition',
  'Excellent Condition - Average Price': 'trendValue.averagePrice.excellentCondition',
  'Excellent Condition - Highest Realised Price': 'trendValue.highestRealisedPrice.excellentCondition',
  'Good Condition - OEM/Dealer Estimation': 'trendValue.oemPrice.goodCondition',
  'Good Condition - Average Price': 'trendValue.averagePrice.goodCondition',
  'Good Condition - Highest Realised Price': 'trendValue.highestRealisedPrice.goodCondition',
  'Average Condition - OEM/Dealer Estimation': 'trendValue.oemPrice.averageCondition',
  'Average Condition - Average Price': 'trendValue.averagePrice.averageCondition',
  'Average Condition - Highest Realised Price': 'trendValue.highestRealisedPrice.averageCondition'
};


exports.exportPriceTrend = function (req, res) {

  var filter = {};
  var query = PriceTrend.find(filter).sort({ saleYear: -1 });
  query.exec(
    function (err, trends) {
      if (err) { return handleError(res, err); }
      var dataArr = [];
      var headers = Object.keys(PRICE_TREND_FIELD_MAP);
      dataArr.push(headers);
      trends.forEach(function (item, idx) {
        dataArr[idx + 1] = [];
        headers.forEach(function (header) {
          dataArr[idx + 1].push(_.get(item, PRICE_TREND_FIELD_MAP[header], ''));
        });

      });
      _transformResponse(res, dataArr, headers);
    });

}

function _transformResponse(res, dataArr, headers) {
  var tempData = [];
  dataArr.forEach(function (data) {
    var obj = {};
    headers.forEach(function (item, index) {
      obj[headers[headers.length - (headers.length - index)]] = data[headers.length - (headers.length - index)];
    });
    tempData.push(obj);
  });
  tempData.splice(0, 1);
  try {
    Utility.convertToCSV(res, tempData);
  } catch (e) {
    throw e;
  }
}

exports.importPriceTrend = function (req, res) {
  var fileName = req.body.filename;
  var workbook = null;
  try {
    workbook = xlsx.readFile(importPath + fileName);
  } catch (e) {
    console.log(e);
    return handleError(res, "Error in file upload");
  }
  if (!workbook)
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];

  var data = xlsx.utils.sheet_to_json(worksheet);

  if (data.length == 0) {
    return res.status(202).json({ errorCode: 1, message: "There is no data in the file." });
  }

  if (data.length > 101) {
    return res.status(202).json({ errorCode: 1, message: "System will accept only 100 records in a single file." });
  }

  if (!Utility.validateExcelHeader(worksheet, Object.keys(PRICE_TREND_FIELD_MAP))) {
    return res.status(202).json({ errorCode: 1, message: "Wrong template." });
  }

  req.counter = 0;
  req.numberOfCount = data.length;
  req.errors = [];
  importPriceTrend(req, res, data);
}

function importPriceTrend(req, res, data) {
  if (req.counter < req.numberOfCount) {
    var row = data[req.counter];
    var errObj = validateTrendData(row, req.counter);
    if (errObj) {
      req.errors[req.errors.length] = errObj;
      req.counter++;
      importPriceTrend(req, res, data);
      return;
    }
    var trendData = _createPriceTrendModel(row);
    var query = Model.find({ name: trendData.model.name, 'category.name': trendData.category.name, 'brand.name': trendData.brand.name });
    query.exec(function (err, resultData) {
      if (err) { return handleError(res, err); }
      if (resultData.length == 0) {
        var errorObj = {};
        errorObj['rowCount'] = req.counter + 2;
        errorObj['message'] = "Category,Brand,Model combination is not found.";
        req.errors[req.errors.length] = errorObj;
        req.counter++;
        importPriceTrend(req, res, data);
        return;
      }

      trendData.category._id = resultData[0].category._id + "";
      trendData.brand._id = resultData[0].brand._id + "";
      trendData.model._id = resultData[0]._id + "";
      _checkAndCreate(req, res, data, trendData);
    })

  } else {
    res.status(200).json({ errorCode: 0, successCount: req.numberOfCount - req.errors.length, errorList: req.errors });
  }

}

function _checkAndCreate(req, res, data, trenData) {

  trenData.createdAt = new Date();
  trenData.updatedAt = new Date();
  var filter = {};
  filter["category._id"] = trenData.category._id;
  filter["brand._id"] = trenData.brand._id;
  filter["model._id"] = trenData.model._id;

  filter["mfgYear"] = trenData.mfgYear;
  filter["saleYear"] = trenData.saleYear;

  PriceTrend.find(filter, function (err, trends) {
    if (err) { return handleError(res, err); }
    else if (trends.length > 0) {
      var errorObj = {};
      errorObj['rowCount'] = req.counter + 2;
      errorObj['message'] = "Price trend already exist.";
      req.errors[req.errors.length] = errorObj;
      req.counter++;
      importPriceTrend(req, res, data);
      return;
    }
    else {
      PriceTrend.create(trenData, function (err, newTrend) {
        if (err) { return handleError(res, err); }
        req.counter++;
        importPriceTrend(req, res, data);
      });
    }

  });
}

function _createPriceTrendModel(rowData) {
  var trData = {};
  Object.keys(PRICE_TREND_FIELD_MAP)
    .forEach(function (key) {
      var val = rowData[key];
      var field = PRICE_TREND_FIELD_MAP[key];
      var fieldArr = field.split('.');
      if (val)
        _createProperty(trData, fieldArr, 0, _.trim(val));
    });
  return trData;
}

function _createProperty(obj, keys, counter, val) {
  var newObj = null;
  if (keys.length == 1) {
    obj[keys[counter]] = val;
    return;
  }

  if (!obj[keys[counter]])
    newObj = obj[keys[counter]] = {};
  else
    newObj = obj[keys[counter]];
  counter++;

  if (counter < keys.length - 1)
    _createProperty(newObj, keys, counter, val);
  else
    newObj[keys[counter]] = val;
}

function validateTrendData(trenData, rowNumber) {
  var requiredFields = ['Category', 'Brand', 'Model', 'Manufatcuring Year', 'Sale Year'];
  var errorObj = null;
  for (var i = 0; i < requiredFields.length > 0; i++) {
    if (!trenData[requiredFields[i]]) {
      errorObj = {};
      errorObj['rowCount'] = rowNumber + 2;
      errorObj['message'] = requiredFields[i] + " is mandatory to be filled.";
      break;
    }

    if (i > 2 && trenData[requiredFields[i]].length != 4) {
      errorObj = {};
      errorObj['rowCount'] = rowNumber + 2;
      errorObj['message'] = requiredFields[i] + " is not valid year.";
      break;
    }
  }
  return errorObj;
}

exports.migratePriceTrend = function (req, res) {
  var query = PriceTrend.find({});
  query.exec(function (err, prsTrends) {
    if (err) { return handleError(res, err); }
    req.counter = 0;
    req.total = prsTrends.length;
    migratePriceTrend(req, res, prsTrends);
  });
}

function migratePriceTrend(req, res, trendsData) {
  if (req.counter < req.total) {
    var prTrend = trendsData[req.counter];
    prTrend = prTrend.toObject()
    var _id = prTrend._id;
    delete prTrend._id;
    var trendValue = prTrend.trendValue;
    if (!trendValue) {
      req.counter++;
      migratePriceTrend(req, res, trendsData);
      return;
    }
    prTrend.trendValue = {};
    if (trendValue.oemPrice) {
      prTrend.trendValue.oemPrice = {};
      if (trendValue.oemPrice.workingCondition)
        prTrend.trendValue.oemPrice.excellentCondition = trendValue.oemPrice.workingCondition;
      if (trendValue.oemPrice.averageCondition)
        prTrend.trendValue.oemPrice.goodCondition = trendValue.oemPrice.averageCondition;
      if (trendValue.oemPrice.requireMajorRepair)
        prTrend.trendValue.oemPrice.averageCondition = trendValue.oemPrice.requireMajorRepair;
    }

    if (trendValue.marketPrice) {

      prTrend.trendValue.averagePrice = {};
      if (trendValue.marketPrice.workingCondition)
        prTrend.trendValue.averagePrice.excellentCondition = trendValue.marketPrice.workingCondition;
      if (trendValue.marketPrice.averageCondition)
        prTrend.trendValue.averagePrice.goodCondition = trendValue.marketPrice.averageCondition;
      if (trendValue.marketPrice.requireMajorRepair)
        prTrend.trendValue.averagePrice.averageCondition = trendValue.marketPrice.requireMajorRepair;
    }

    if (trendValue.highestRealisedPrice) {
      prTrend.trendValue.highestRealisedPrice = {};
      if (trendValue.highestRealisedPrice.workingCondition)
        prTrend.trendValue.highestRealisedPrice.excellentCondition = trendValue.highestRealisedPrice.workingCondition;
      if (trendValue.highestRealisedPrice.averageCondition)
        prTrend.trendValue.highestRealisedPrice.goodCondition = trendValue.highestRealisedPrice.averageCondition;
      if (trendValue.highestRealisedPrice.requireMajorRepair)
        prTrend.trendValue.highestRealisedPrice.averageCondition = trendValue.highestRealisedPrice.requireMajorRepair;
    }
    PriceTrend.update({ _id: _id }, { $set: prTrend }, function (err, updatedResult) {
      req.counter++;
      migratePriceTrend(req, res, trendsData);
    });
  } else {
    res.status(200).send("Ok");
  }
}
exports.saveSurvey = function (req, res) {
  PriceTrendSurvey.create(req.body, function (err, newTrendSurvey) {
    if (err) { return handleError(res, err); }
    return res.status(200).json({ errorCode: 0, message: "Price trend survey saved sucessfully" });
  });
}

exports.surveyAnalytics = function (req, res) {

  var filter = {};

  if (req.body.productId)
    filter['product._id'] = req.body.productId;

  if (req.body.priceTrendId)
    filter['priceTrend._id'] = req.body.priceTrendId;

  PriceTrendSurvey.aggregate(
    { $match: filter },
    {
      $group:
        { _id: '$agree', count: { $sum: 1 } }
    },
    { $sort: { count: -1 } },
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}

exports.getSurveyOnFilter = function (req, res) {

  var filter = {};
  var orFilter = [];

  if (req.body.searchStr) {
    var term = new RegExp(req.body.searchStr, 'i');
    orFilter[orFilter.length] = { "product.category": { $regex: term } };
    orFilter[orFilter.length] = { "product.brand": { $regex: term } };
    orFilter[orFilter.length] = { "product.model": { $regex: term } };
    orFilter[orFilter.length] = { "product.mfgYear": { $regex: term } };
    orFilter[orFilter.length] = { "priceTrend.saleYear": { $regex: term } };
    orFilter[orFilter.length] = { "user.fname": { $regex: term } };
    orFilter[orFilter.length] = { "user.lname": { $regex: term } };
    orFilter[orFilter.length] = { agree: { $regex: term } };
    orFilter[orFilter.length] = { comment: { $regex: term } };
  }

  if (orFilter.length > 0) {
    filter['$or'] = orFilter;
  }

  if (req.body.productId)
    filter['product._id'] = req.body.productId;
  if (req.body.priceTrendId)
    filter['priceTrend._id'] = req.body.priceTrendId;
  if (req.body.agree)
    filter['agree'] = req.body.agree;

  if (req.body.pagination) {
    Utility.paginatedResult(req, res, PriceTrendSurvey, filter, {});
    return;
  }

  PriceTrendSurvey.find(filter, function (err, result) {
    if (err) { return handleError(res, err); }
    return res.status(200).json(result);
  })
}

function handleError(res, err) {
  return res.status(500).send(err);
}