(function() {
	'use strict';

	angular.module('sreizaoApp').factory("AssetSaleSvc", AssetSaleSvc);

	function AssetSaleSvc($http) {
		var svc = {};
		var assetSaleQuippoHost = "http://localhost:7000";
		svc.submitBid = submitBid;
		svc.searchBid=searchBid;

		function submitBid(data) {
			return $http.post(assetSaleQuippoHost + '/assetSale/submitBid', data)
				.then(function(res) {
                  
				})
				.catch(function(err) {
					throw err;
				});
		}

		function searchBid(){
			return $http.get(assetSaleQuippoHost + '/assetSale')
		           .then(function(res){

		           });
		}

		return svc;

	}

})();

//Data to be sent to submit a bid
/*
userId,_id,ticketId,

*/