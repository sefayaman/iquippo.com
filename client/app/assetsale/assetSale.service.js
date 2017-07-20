(function() {
	'use strict';

	angular.module('sreizaoApp').factory("AssetSaleSvc", AssetSaleSvc);

	function AssetSaleSvc($http,UtilSvc) {
		var svc = {};
		var path='api/assetSale';
		svc.submitBid = submitBid;
    svc.countBid=countBid;
		svc.searchBid=searchBid;
    svc.withdrawBid=withdrawBid;
    svc.fetchBid=fetchBid;
    svc.get=get;
    svc.getMaxBidOnProduct = getMaxBidOnProduct;
    svc.fetchFAData = fetchFAData;
    
		function submitBid(data) {
			return $http.post(path + '/submitbid?typeOfRequest='+data.typeOfRequest, data)
				.then(function(res) {
          return res.data; 
				})
				.catch(function(err) {
					if(err)
            throw err;
				});
		}

    function withdrawBid(data){
      return $http.post(path + '/withdrawBid', data)
				.then(function(res) {
          return res.data;                  
				})
				.catch(function(err) {
					if(err)
            throw err;
				});
    }

		function searchBid(){
			return $http.get(path + '/assetSale')
        .then(function(res){
          return res.data;
        });
		}

	function fetchBid(data){
		var serPath = path;
    var queryParam = "";
    if(data)
        queryParam = UtilSvc.buildQueryParam(data);
    if(queryParam)
      serPath = serPath + "?" + queryParam;
    return $http.get(serPath)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err;
    });
	}

    function fetchFAData(data){
        var serPath = path;
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = serPath + "/fa" + "?" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          if(err)
          throw err;
        });
    }

    function countBid(data){
    var serPath = "";
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = path + "/count?" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          if(err)
          throw err;
        });
  }

  function getMaxBidOnProduct(data) {
    var serPath = path;
    var queryParam = "";
    if(data)
        queryParam = UtilSvc.buildQueryParam(data);
    if(queryParam)
      serPath = serPath + "/maxbidonproduct" + "?" + queryParam;
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