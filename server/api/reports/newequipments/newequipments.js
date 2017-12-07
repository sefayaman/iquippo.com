'use strict';

var BookADemoModel = require('../../common/bookademo.model');
var NewOfferReqModel = require('../../common/newofferrequest.model');
var APIError = require('../../../components/_error');
var _ = require('lodash');
var utility = require('../../../components/utility');
var validator = require('validator');

var reports = {
  count: function (req, res, next) {
    var options = req.query;
    var filters = {};
    var Model = options.type === 'bookademo' ? BookADemoModel : NewOfferReqModel;
    //if(options.userMobileNos)
    //    filters['quote.mobile'] = {$in:options.userMobileNos.split(',')};

    //filters.type = options && options.type;
    if (options.searchStr && options.searchStr !== 'undefined') {
      filters['$text'] = {
        '$search': options.searchStr
      };
    }

    Model.find(filters).count().exec(function (err, count) {
      if (err)
        return next(err);
      return res.status(200).json({
        count: count
      });
    });

  },

  fetch: function (req, res, next) {
    var query = null;
    var options = req.query || {};
    var filters = {};
    var Model = options.type === 'bookademo' ? BookADemoModel : NewOfferReqModel;
    var sort = {
      '_id': -1
    };

    if (options.first_id && options.first_id !== 'null' && validator.isMongoId(options.first_id)) {
      filters._id = {
        '$gt': options.first_id
      };

      sort = {
        '_id': 1
      };
    }

    if (options.last_id && options.last_id !== 'null' && validator.isMongoId(options.last_id)) {
      filters._id = {
        '$lt': options.last_id
      };
    }

    if (options.last_id && options.last_id !== 'null' && options.first_id && options.first_id !== 'null' && validator.isMongoId(options.first_id) && validator.isMongoId(options.last_id)) {
      filters._id = {
        '$gt': options.first_id,
        '$lt': options.last_id
      };
    }

    //if (options.userMobileNos)
    //  filters['quote.mobile'] = {
    //    $in: options.userMobileNos.split(',')
    //  };

    if (options.searchStr && options.searchStr !== 'undefined') {
      filters['$text'] = {
        '$search': options.searchStr
      };
    }

    query = Model.find(filters);
    query = query.sort(sort);

    options.offset = Math.abs(Number(options.offset));

    if (options.offset)
      query = query.skip(options.offset);

    //if (options.type)
    //  query = query.where('type').equals(options.type);

    if (!Number(options.limit))
      delete options.limit;

    query = query.limit(Number(options.limit) || 50);

    query.exec(fetchData);

    function fetchData(err, reportData) {
      if (err)
        return next(err);

      if (!res)
        return next(new APIError(400, 'Error while fetching data from db'));

      if (options.first_id && options.first_id !== 'null')
        reportData = reportData.reverse();

      req.reportData = reportData;
      return next();
    }

  },

  renderJson: function (req, res, next) {
    if (!req && !req.reportData)
      return next(new APIError(400, 'No Report Data to render'));

    res.status(200).json(req.reportData);
  },
  renderCsv: function (req, res, next) {
    if (!req && !req.reportData)
      return next(new APIError(400, 'No Report Data to render'));

    var data = req.reportData;
    var type = (req.query && req.query.type) || 'newofferreq';
    
    var csvData = {
      'newofferreq': {
        headers: ['Order Id', 'Full Name', 'Category','Brand','Model','State','Email Address','Mobile No','Date of Order']
      },
      'bookademo': {
        headers: [ 'Full Name', 'Country','State', 'Location', 'Mobile No', 'Email Address','Category','Brand','Model','Date of Request']
      }
    };

    var xlsxData = [];
    var json = {};
    var arr = [];
    data.forEach(function (x) {
      json = {};
      arr = [];

      switch (type) {
        case 'newofferreq':
          arr.push(
            _.get(x, 'orderId', ''),
            _.get(x, 'fname', '') + ' ' + _.get(x, 'lname', ''),
            _.get(x, 'category.name', '') ,
            _.get(x, 'brand.name', '') ,
            _.get(x, 'model.name', '') ,
            _.get(x, 'state', ''),
            _.get(x, 'email', ''),
            _.get(x, 'mobile', ''),
            utility.toIST(_.get(x, 'createdAt', ''))
          );
          break;
        case 'bookademo':
          json = {};
          arr = [];
          arr.push(
            _.get(x, 'fname', '') + ' ' + _.get(x, 'lname', ''),
            _.get(x, 'country', ''),
            _.get(x, 'state', ''),
            _.get(x, 'city', ''),
            _.get(x, 'mobile', ''),
            _.get(x, 'email', ''),
            _.get(x, 'category', ''),
            _.get(x, 'brand', ''),
            _.get(x, 'model', ''),
            utility.toIST(_.get(x, 'createdAt', ''))
          );
          break;
        default:
          res.json({
            err: 'Invalid choice'
          });
      }

      for (var i = 0; i < csvData[type].headers.length; i++) {
        json[csvData[type].headers[i]] = arr[i];
      }

      xlsxData.push(json);
    });
    res.xls(type + '_report.xlsx', xlsxData);
    //res.end();
  }
};

module.exports = reports;

//Unit Test


if (require.main === module) {
  (function () {
    //reports.count({}, console.log);
    reports.fetch({
      type: 'shipping',
      after_id: '58492f8e23e7a2bc20a252d1'
    }, console.log);
  }());
}
