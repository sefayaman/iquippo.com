(function() {
	'use strict';

	angular.module('sreizaoApp').factory("AssetSaleSvc", AssetSaleSvc);

	function AssetSaleSvc($http,Auth,UtilSvc) {
		var svc = {};
		var path='api/assetSale';
		svc.submitBid = submitBid;
    svc.setStatus = setStatus;
    svc.update = update;
    svc.countBid = countBid;
		svc.searchBid = searchBid;
    svc.withdrawBid = withdrawBid;
    svc.fetchBid = fetchBid;
    svc.get = get;
    svc.getMaxBidOnProduct = getMaxBidOnProduct;
    svc.getBidProduct = getBidProduct;
	  svc.getBidOrBuyCalculation = getBidOrBuyCalculation;
    svc.validateAction = validateAction;
    svc.getEmdOnProduct = getEmdOnProduct;

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

     function setStatus(bid,status,statusField,historyField){ 
        bid[statusField] = status;
        var stsObj = {};
        stsObj.status = status;
        stsObj.userId = Auth.getCurrentUser()._id;
        stsObj.createdAt = new Date();
        if(!bid[historyField])
          bid[historyField] = [];
        bid[historyField].push(stsObj);
    }

    function update(data,action){
       return $http.put(path + "/" + data._id + "?action=" + action, data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function withdrawBid(data){
      return $http.post(path + '/withdrawbid', data)
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

  function getBidOrBuyCalculation(data){
    var serPath = path;
    var queryParam = "";
    if(data)
        queryParam = UtilSvc.buildQueryParam(data);
    if(queryParam)
      serPath = serPath + "/bidorbuycalculation" + "?" + queryParam;
    return $http.get(serPath)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err;
    });
  }

  function getEmdOnProduct(data){
    var serPath = path;
    var queryParam = "";
    if(data)
        queryParam = UtilSvc.buildQueryParam(data);
    if(queryParam)
      serPath = serPath + "/getemd" + "?" + queryParam;
    return $http.get(serPath)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
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

  function getBidProduct(filter){
    return $http.post(path + "/bidproduct",filter)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err
    })
  }

  function validateAction(bid,action){
    var retVal = false;
    switch(action){
      case 'APPROVE':
        var isValidStatus = bid.bidStatus === bidStatuses[0]?true:false;
        if(Auth.isAdmin() && isValidStatus)
          retVal = true;
        else if(isValidStatus && Auth.getCurrentUser()._id === bid.product.seller._id)
          retVal = true;
        else
          retVal = false;
      break;
      case 'REJECT':
        if(Auth.isAdmin() && [bidStatuses[0],bidStatuses[7],bidStatuses[8]].indexOf(bid.bidStatus) !== -1)
          retVal = true;
        else if(Auth.getCurrentUser()._id === bid.product.seller._id && bid.bidStatus === bidStatuses[0])
          retVal = true;
        else
          retVal = false;
      break;
      case 'EMDPAYMENT':
         var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && bid.dealStatus === dealStatuses[6] ? true:false;
        if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner() || bid.user._id === Auth.getCurrentUser()._id))
            retVal = true;
         else
          retVal = false;
      break;
      case 'FULLPAYMENT':
         var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && bid.dealStatus === dealStatuses[7] ? true:false;
        if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner() || bid.user._id === Auth.getCurrentUser()._id))
            retVal = true;
         else
          retVal = false;
      break;

      case 'KYC':
        if(bidStatuses.indexOf(bid.bidStatus) > 6 && dealStatuses.indexOf(bid.dealStatus) > 5)
          retVal = true;
        else
          retVal = false; 
      break;
      case 'DOISSUED':
        var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && bid.dealStatus === dealStatuses[8] ? true:false;
         if((Auth.isFAgencyPartner() || Auth.isAdmin() || Auth.getCurrentUser()._id === bid.product.seller._id) && isValidStatus)
          retVal = true;
         else
          retVal = false;
      break;
      case 'INVOICEDETAIL':
        var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && dealStatuses.indexOf(bid.dealStatus)> 5 ? true:false;
        if(isValidStatus && bid.user._id === Auth.getCurrentUser()._id)
          retVal = true;
         else if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner()))
          retVal = true;
         else
          retVal = false;
      break;
       case 'ACCEPTANCEOFDELIVERY':
        var isValidStatus = bid.bidStatus === bidStatuses[7] && bid.dealStatus === dealStatuses[10]; 
        if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner() || bid.user._id === Auth.getCurrentUser()._id))
          retVal = true;
        else
          retVal = false; 
      break;
      case 'DELIVERED':
        var isValidStatus = bid.bidStatus === bidStatuses[7] && bid.dealStatus === dealStatuses[9]; 
        if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner() || bid.product.seller._id === Auth.getCurrentUser()._id))
          retVal = true;
        else
          retVal = false;
        break;
        case 'CHANGEBID':
        case 'WITHDRAWBID':
        var isValidStatus = [bidStatuses[0],bidStatuses[7]].indexOf(bid.bidStatus) !== -1 && bid.dealStatus === dealStatuses[0]; 
        if(isValidStatus && bid.user._id === Auth.getCurrentUser()._id)
          retVal = true;
        else
          retVal = false;
        break;
      default:
        retVal = false;
      break;

    }

    return retVal;
  }

		return svc;
	}

})();