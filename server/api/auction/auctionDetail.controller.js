var Auction = require('./auction.model');

var auctionData = {

		count: function(req, res) {
			var filters={};
             console.log(req.query.auctionId);
			      filters.dbAuctionId=req.query.auctionId;
                  

				var query = Auction.find(filters);
				query.count().exec(
					function(err, auctions) {
						if (err) {
							return handleError(res, err);
						}
						console.log(auctions);
						return res.status(200).json(auctions);
					}
				);
			 
		},
fetch: function(req, res, next) {
		var query = null;
		var filters = {};
		if(Number(req.query.auctionId))
			filters.auctionId=(req.query.auctionId);
		console.log(filters);
		var query=Auction.find(filters);

		query.exec(function(err,auctionsItems){
			if(err){
				return handleError(res,err);
			}
			console.log(auctionsItems);
			return res.status(200).json(auctionsItems);
		});

	}
	};

	module.exports=auctionData;

