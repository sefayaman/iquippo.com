var Auction = require('./auction.model');

var auctionData = {

		count: function(req, res,next) {
			var filters={};
             console.log(req.query.auctionId);
			      filters.auctionId=req.query.auctionId;
                  

				//var query = Auction.find(filters);
				
                     var query=Auction.aggregate([{"$group":{_id:"$auctionId",count:{$sum:1},sumOfInsale:{$sum:"$emdAmount"}}}]);

				query.exec(
					function(err, auctions) {
						if (err) {
							return next(err);
						}
						console.log(auctions);
                        var query2=Auction.aggregate([{"$group":{_id:"$isSold",count:{$sum:1,auctionId:1}}}])
                        	query2.exec(function(err,isSoldCount){
                        		if (err) {
							return next(err);
						}
						    console.log(isSoldCount);
                        	});

						return res.status(200).send(auctions);
					}
				);
			 
		},
fetch: function(req, res, next) {
		var query = null;
		var filters = {};
		if(Array.isArray(req.query.auctionId)){
			filter = {
				auctionId : {
					'$in' : req.query.auctionId 
				}
			}
		}
		else
			filters.auctionId=(req.query.auctionId);
		
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

