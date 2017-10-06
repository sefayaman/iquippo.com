(function() {
	'use strict';

	angular.module('sreizaoApp').factory("AssetSaleSvc", AssetSaleSvc);

	function AssetSaleSvc($http,Auth,UtilSvc, Modal) {
		var svc = {};
		var path='api/assetSale';
		svc.submitBid = submitBid;
    svc.setStatus = setStatus;
    svc.update = update;
    svc.countBid = countBid;
		svc.searchBid = searchBid;
    svc.withdrawBid = withdrawBid;
    //svc.fetchBid = fetchBid;
    svc.get = get;
    svc.getMaxBidOnProduct = getMaxBidOnProduct;
    svc.getBidProduct = getBidProduct;
	  svc.getBidOrBuyCalculation = getBidOrBuyCalculation;
    svc.validateAction = validateAction;
    svc.getEmdOnProduct = getEmdOnProduct;
    svc.changeBidStatus = changeBidStatus;
    svc.exportExcel = exportExcel;
    svc.ageingOfAssetInPortal = ageingOfAssetInPortal;

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

	/*function fetchBid(data){
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
*/
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
    var validEnterprise = (Auth.isEnterprise() || (Auth.isEnterpriseUser() && Auth.isBuySaleApprover())) && Auth.getCurrentUser().enterpriseId === bid.product.seller.enterpriseId;
    switch(action){
      case 'APPROVE':
        var isValidStatus = bid.bidStatus === bidStatuses[0]?true:false;
        if(Auth.isAdmin() && isValidStatus)
          retVal = true;
        else if(validEnterprise && isValidStatus)
          return true;
        else if(isValidStatus && Auth.getCurrentUser()._id === bid.product.seller._id)
          retVal = true;
        else
          retVal = false;
      break;
      case 'REJECT':
        if(Auth.isAdmin() && [bidStatuses[0],bidStatuses[7],bidStatuses[8]].indexOf(bid.bidStatus) !== -1)
          retVal = true;
        else if((Auth.getCurrentUser()._id === bid.product.seller._id || validEnterprise) && bid.bidStatus === bidStatuses[0])
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
      case 'VIEWEMDPAYMENT':
         var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && dealStatuses.indexOf(bid.dealStatus) > 6 ? true:false;
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
      case 'VIEWFULLPAYMENT':
         var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && dealStatuses.indexOf(bid.dealStatus) > 7 ? true:false;
        if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner() || bid.user._id === Auth.getCurrentUser()._id))
            retVal = true;
         else
          retVal = false;
      break;
      case 'KYC':
        if(bidStatuses.indexOf(bid.bidStatus) > 6 && dealStatuses.indexOf(bid.dealStatus) > 7)
          retVal = true;
        else
          retVal = false; 
      break;
      case 'DOISSUED':
        var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && bid.dealStatus === dealStatuses[8] ? true:false;
         if((Auth.isFAgencyPartner() || Auth.isAdmin() || Auth.getCurrentUser()._id === bid.product.seller._id || validEnterprise) && isValidStatus)
          retVal = true;
         else
          retVal = false;
      break;
      case 'INVOICEDETAIL':
        var isValidStatus = bidStatuses.indexOf(bid.bidStatus) > 6 && dealStatuses.indexOf(bid.dealStatus)> 7 ? true:false;
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
        if(isValidStatus && (Auth.isAdmin() || Auth.isFAgencyPartner() || bid.product.seller._id === Auth.getCurrentUser()._id || validEnterprise))
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

  function changeBidStatus(bid,action,cb){
    switch(action){
      case 'approve':
        setStatus(bid,bidStatuses[7],'bidStatus','bidStatuses');
      break;
      case 'reject':
        setStatus(bid,bidStatuses[6],'bidStatus','bidStatuses');
        setStatus(bid,dealStatuses[1],'dealStatus','dealStatuses');
      break;
      case 'emdpayment':
        if(typeof bid.emdPayment.remainingPayment === 'undefined' || bid.emdPayment.remainingPayment > 0){
          Modal.alert("EMD has not been fully paid.");
          return;
        }
        setStatus(bid,dealStatuses[7],'dealStatus','dealStatuses');
      break;
      case 'fullpayment':
        if( typeof bid.fullPayment.remainingPayment === 'undefined' || bid.fullPayment.remainingPayment > 0){
          Modal.alert("Full payment has not been fully paid.");
          return;
        }
        setStatus(bid,dealStatuses[8],'dealStatus','dealStatuses');
      break;
      case 'doissued':
        setStatus(bid,dealStatuses[9],'dealStatus','dealStatuses');
      break;
      case 'deliverd':
        setStatus(bid,dealStatuses[10],'dealStatus','dealStatuses');
      break;
      case 'deliveryaccept':
        setStatus(bid,dealStatuses[11],'dealStatus','dealStatuses');
        setStatus(bid,dealStatuses[12],'dealStatus','dealStatuses');
      break;
      default:
        return;
      break
    }
    update(bid,action)
    .then(function(res){
      if(cb)
        cb(true);
    })
    .catch(function(err){
      if(err)
        Modal.alert(err.data);
        if(cb)
          cb(true);
    });
  }

  function ageingOfAssetInPortal(createdDate) {
    var date2 = new Date(createdDate);
    var date1 = new Date();
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());   
    var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
    
    return dayDifference;
  }

  function exportExcel(filter){
    var serPath = path;
    var reportType = "Product_Bid";
    var queryParam = "";
    if(filter)
        queryParam = UtilSvc.buildQueryParam(filter);
    if(queryParam)
      serPath = serPath + "/export" + "?" + queryParam;
    return $http.get(serPath)
    .then(function(res){
       saveAs(new Blob([s2ab(res.data)],{type:"application/octet-stream"}),reportType+"_"+ new Date().getTime() +".xlsx");
      //return res.data
    })
    .catch(function(err){
      throw err;
    })
  }

		return svc;
	}

})();