'use strict';

var Model = require('../services/services.model');
var APIError = require('../../components/_error');
var moment = require('moment');
var _ = require('lodash');

var reports = {
	count: function(req, res, next) {
		var options = req.query;
		var filters = {};
		if(options.userMobileNos)
		    filters['quote.mobile'] = {$in:options.userMobileNos.split(',')};
		filters.type = options && options.type;
		if (options.searchStr && options.searchStr !== 'undefined') {
			filters['$text'] = {
				'$search': options.searchStr
			}
		}

		return Model.find(filters).count().exec(function(err, count) {
			if (err)
				return next(err);
			return res.status(200).json({
				count: count
			});
		})

	},
	fetch: function(req, res, next) {
		var query = null;
		var options = req.query || {};
		var filters = {};
		var sort = {
			'_id': -1
		};

		if (options.first_id && options.first_id !== 'null') {
			filters._id = {
				'$gt': options.first_id
			};

			sort = {
				'_id': 1
			};
		}

		if (options.last_id && options.last_id !== 'null') {
			filters._id = {
				'$lt': options.last_id
			};
		}

		if (options.last_id && options.last_id !== 'null' && options.first_id && options.first_id !== 'null') {
			filters._id = {
				'$gt': options.first_id,
				'$lt': options.last_id
			};
		}

		if(options.userMobileNos)
		    filters['quote.mobile'] = {$in:options.userMobileNos.split(',')};
		
		if (options.searchStr && options.searchStr !== 'undefined') {
			filters['$text'] = {
				'$search': options.searchStr
			}
		}

		query = Model.find(filters);
		query = query.sort(sort);

		options.offset = Math.abs(Number(options.offset));

		if (options.offset)
			query = query.skip(options.offset);

		if (options.type)
			query = query.where('type').equals(options.type);

		query = query.limit(options.limit || 10);

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

	renderJson: function(req, res, next) {
		if (!req && !req.reportData)
			return next(new APIError(400, 'No Report Data to render'));

		res.status(200).json(req.reportData);
	},
	renderCsv: function(req, res, next) {
		if (!req && !req.reportData)
			return next(new APIError(400, 'No Report Data to render'));

		var data = req.reportData;
		var type = (req.query && req.query.type) || 'shipping';
		//res.set('Content-Disposition', 'attachment; filename="' + type + '_' + Date.now() + '.csv"');

		var csvData = {
			'shipping': {
				headers: ['Ticket Id','Full Name', 'Country', 'Location', 'Company Name', 'Designation', 'Phone No', 'Mobile No', 'Email Address', 'Shipment Allowed', 'Packaging', 'Comments', 'Date of Request']
			},
			'valuation': {
				headers: ['Ticket Id','Full Name', 'Country', 'Location', 'Company Name', 'Designation', 'Phone No', 'Mobile No', 'Email Address', 'Category', 'Brand', 'Modal', 'Location of Asset', 'Manufacturing Year', 'Asset Description', 'Contact Person', 'Contact Number', 'Purpose of Valutaion', 'Schedule a Call', 'Comments', 'Date of Request']
			},
			'finance': {
				headers: ['Ticket Id','Full Name', 'Country', 'Location', 'Company Name', 'Designation', 'Phone No', 'Mobile No', 'Email Address', 'Category', 'Brand', 'Modal', 'Location of Asset', 'Manufacturing Year', 'Asset Description', 'Amount to be Financed', 'Indicative Rate', 'Tenure\(in Months\)', 'Method Of Contact', 'Comments', 'Date of Request']
			},
			'insurance': {
				headers: ['Ticket Id','Full Name', 'Country', 'Location', 'Company Name', 'Designation', 'Phone No', 'Mobile No', 'Email Address', 'Category', 'Brand', 'Modal', 'Location of Asset', 'Manufacturing Year', 'Asset Description', 'Invoice value', 'Method Of Contact', 'Comments', 'Date of Request', ]
			}
		};

		var xlsxData = [];
		var json = {};
		var arr = [];
		data.forEach(function(x) {
			json = {};
			arr = [];

			switch (type) {
				case 'shipping':
					arr.push(
						_.get(x, 'ticketId', ''),
						_.get(x, 'quote.fname', '') + ' ' + _.get(x, 'quote.lname', ''),
						_.get(x, 'quote.country', ''),
						_.get(x, 'quote.city', ''),
						_.get(x, 'quote.companyname', ''),
						_.get(x, 'quote.designation', ''),
						_.get(x, 'quote.phone', ''),
						_.get(x, 'quote.mobile', ''),
						_.get(x, 'quote.email', ''),
						_.get(x, 'quote.allowed', ''),
						_.get(x, 'quote.packaging', ''),
						_.get(x, 'quote.comment', ''),
						moment(_.get(x, 'createdAt', '')).format('MM/DD/YYYY')
					);
					break;
				case 'valuation':
					json = {};
					arr = [];
					arr.push(
						_.get(x, 'ticketId', ''),
						_.get(x, 'quote.fname', '') + ' ' + _.get(x, 'quote.lname', ''),
						_.get(x, 'quote.country', ''),
						_.get(x, 'quote.city', ''),
						_.get(x, 'quote.companyname', ''),
						_.get(x, 'quote.designation', ''),
						_.get(x, 'quote.phone', ''),
						_.get(x, 'quote.mobile', ''),
						_.get(x, 'quote.email', ''),
						_.get(x,'quote.product.category',''),
						_.get(x,'quote.product.brand',''),
						_.get(x,'quote.product.model',''),
						_.get(x,'quote.product.city',''),
						_.get(x,'quote.product.mfgYear',''),
						_.get(x,'quote.product.description',''),
						_.get(x,'quote.product.contactPerson',''),
						_.get(x,'quote.product.contactNumber',''),
						_.get(x,'quote.valuation')|| _.get(x,'quote.otherName',''),
						_.get(x,'quote.schedule',''),
						_.get(x,'quote.comment',''),
						moment(_.get(x, 'createdAt', '')).format('MM/DD/YYYY')
					);
					break;
				case 'finance':
					json = {};
					arr = [];
					arr.push(
						_.get(x, 'ticketId', ''),
						_.get(x, 'quote.fname', '') + ' ' + _.get(x, 'quote.lname', ''),
						_.get(x, 'quote.country', ''),
						_.get(x, 'quote.city', ''),
						_.get(x, 'quote.companyname', ''),
						_.get(x, 'quote.designation', ''),
						_.get(x, 'quote.phone', ''),
						_.get(x, 'quote.mobile', ''),
						_.get(x, 'quote.email', ''),
						_.get(x,'quote.product.category',''),
						_.get(x,'quote.product.brand',''),
						_.get(x,'quote.product.model',''),
						_.get(x,'quote.product.city',''),
						_.get(x,'quote.product.mfgYear',''),
						_.get(x,'quote.product.description',''),
						_.get(x,'quote.amountToBeFinanced','') ,
						_.get(x,'quote.indicativeRate','') ,
						_.get(x,'quote.periodInMonths','') ,
						_.get(x,'quote.contactMethod','') ,
						_.get(x,'quote.comment','') ,
						moment(_.get(x, 'createdAt', '')).format('MM/DD/YYYY')
					);
					break;
				case 'insurance':
					json = {};
					arr = [];
					arr.push(
						_.get(x, 'ticketId', ''),
						_.get(x, 'quote.fname', '') + ' ' + _.get(x, 'quote.lname', ''),
						_.get(x, 'quote.country', ''),
						_.get(x, 'quote.city', ''),
						_.get(x, 'quote.companyname', ''),
						_.get(x, 'quote.designation', ''),
						_.get(x, 'quote.phone', ''),
						_.get(x, 'quote.mobile', ''),
						_.get(x, 'quote.email', ''),
						_.get(x,'quote.product.category',''),
						_.get(x,'quote.product.brand',''),
						_.get(x,'quote.product.model',''),
						_.get(x,'quote.product.city',''),
						_.get(x,'quote.product.mfgYear',''),
						_.get(x,'quote.product.description',''),
						_.get(x,'quote.amountToBeFinanced','') ,
						_.get(x,'quote.contactMethod','') ,
						_.get(x,'quote.comment','') ,
						moment(_.get(x, 'createdAt', '')).format('MM/DD/YYYY')
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
		})
		res.xls(type + '_report.xlsx', xlsxData);
		//res.end();
	}
};

module.exports = reports;

//Unit Test


if (require.main === module) {
	(function() {
		//reports.count({}, console.log);
		reports.fetch({
			type: 'shipping',
			after_id: '58492f8e23e7a2bc20a252d1'
		}, console.log);
	}())
}