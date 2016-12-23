

var AuctionMaster = require('./auctionmaster.model');

var auctionData = {

		count: function(req, res) {
			var filter={};
             console.log(req.query.auctionType);
			if (req.query.auctionType == 'closedAuctions') {
				console.log("closedAuctionsActive");
				var datei = new Date();
                  filter.endDate={
                  	'$lt': datei
                  }

				var query = AuctionMaster.find(filter);
				query.count().exec(
					function(err, auctions) {
						if (err) {
							return handleError(res, err);
						}
						console.log(auctions);
						return res.status(200).json(auctions);
					}
				);
			} else {
				console.log("upcomingAuctionActive");
				var datei = new Date();
                 var filter={};

                 filter.startDate={
						'$gt': datei
					};
				var query = AuctionMaster.find(filter);
				query.count().exec(
					function(err, auctions) {
						if (err) {
							return handleError(res, err);
						}
						return res.status(200).json(auctions);
					}
				);
			}
		},
fetch: function(req, res, next) {
		var datei=new Date();
		console.log(datei);
		var query = null;
		var options = req.query || {};
		console.log(options);
		var filters = {};
		var sort = {
			'_id': -1
		};

		if (options.first_id && options.first_id !== 'null') {
			console.log(1);
			filters._id = {
				'$gt': options.first_id
			};

			sort = {
				'_id': 1
			};
		}

		if (options.last_id && options.last_id !== 'null') {
			console.log(2);
			filters._id = {
				'$lt': options.last_id
			};
		}

		if (options.last_id && options.last_id !== 'null' && options.first_id && options.first_id !== 'null') {
			console.log(3);
			filters._id = {
				'$gt': options.first_id,
				'$lt': options.last_id
			};
		}
         if(req.query.type=='closedAuctions'){
         	console.log('closedAuctionsDataActive')
         	filters.endDate={
         		'$lt':datei
         	};
         }
         else{
         	console.log('openAuctionsDataActive');
         	filters.startDate={
         		'$gt':datei
         	};
         }

          console.log(filters);
		query = AuctionMaster.find(filters);
		query = query.sort(sort);

		options.offset = Math.abs(Number(options.offset));

		if (options.offset)
			query = query.skip(options.offset);


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
			console.log(req.reportData);
			return next();
		}

	},
	renderJson: function(req, res, next) {
		console.log('rendering Json');
		if (!req && !req.reportData){
			console.log('APIERROR');
			return next(new APIError(400, 'No Report Data to render'));
		}
         console.log(req.reportData);
		res.status(200).json(req.reportData);
	}
	};

	module.exports=auctionData;










