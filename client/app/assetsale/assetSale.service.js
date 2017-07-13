(function() {
	'use strict';

	angular.module('sreizaoApp').factory("AssetSaleSvc", AssetSaleSvc);

	function AssetSaleSvc($http,UtilSvc) {
		var svc = {};
		var path='api/assetSale';
		var assetSaleQuippoHost = "http://localhost:7000";
		svc.submitBid = submitBid;
		svc.searchBid=searchBid;
        svc.fetchBid=fetchBid;
        svc.get=get;
		function submitBid(data) {
			return $http.post(path + '/submitbid', data)
				.then(function(res) {
                  
				})
				.catch(function(err) {
					throw err;
				});
		}

		function searchBid(){
			return $http.get(path + '/assetSale')
		           .then(function(res){

		           });
		}

		function fetchBid(data){
		var serPath = "";
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = path + "?" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
	}

	function get(data) {
        var serPath = path + "?type=request";
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = serPath + "&" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

		return svc;
	}

})();

//Data to be sent to submit a bid
/*
userId,_id,ticketId,

*/