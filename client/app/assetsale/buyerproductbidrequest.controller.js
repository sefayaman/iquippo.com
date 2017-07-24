(function() {
	'use strict';
angular.module('sreizaoApp').controller('BuyerProductBidRequestCtrl', BuyerProductBidRequestCtrl);
function BuyerProductBidRequestCtrl($scope, Auth, Modal, PagerSvc, productSvc, AssetSaleSvc, $rootScope, $uibModal) {
	var vm = this;
	var filter = {};
	var dataToSend={};
	vm.bidListing = [];
	vm.activeBid = "Auctionable";
	$scope.subTabValue = 'auctionable'
	$scope.onTabChange = onTabChange;
	vm.withdrawBid = withdrawBid;
	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	vm.openBidModal = openBidModal;
	$scope.pager = PagerSvc.getPager();
	vm.validateAction = AssetSaleSvc.validateAction;
	var initFilter = {};

	function init() {
		filter = {};
		initFilter.pagination = true;
		angular.copy(initFilter, filter);
		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
			$scope.isAdmin = false;
			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
		}
		filter.offerStatus = offerStatuses[0];
		getBidData(filter);	
	}
	
	function openBidModal(bid) {
      	if (!Auth.getCurrentUser()._id) {
        	Modal.alert("Please Login/Register for submitting your request!", true);
        	return;
      	}
        filter = {};
        filter._id = bid.product.proData;
        filter.status = true;
        productSvc.getProductOnFilter(filter).then(function(result) {
          	if (result && result.length < 1) {
	            Modal.alert("Product not available!", true);
	            return;
          	}
          	$scope.currentProduct = result[0];
			var bidSummaryScope = $rootScope.$new();
	      	bidSummaryScope.params = {
		        bidAmount : 0,
		        product : $scope.currentProduct,
		        stateId : bid.stateId, 
		        bid : "placebid",
		        offerType : "Bid",
		        typeOfRequest : "changeBid"
	      	};

		    var bidSummaryModal = $uibModal.open({
		        templateUrl: "/app/assetsale/assetbidpopup.html",
		        scope: bidSummaryScope,
		        controller: 'AssetBidPopUpCtrl as assetBidPopUpVm',
		        windowTopClass: 'bidmodal',
		        size: 'xs'
		    });

		  	bidSummaryScope.close = function() {
		        bidSummaryModal.close();
		  	};
	  	});
    }

    function openDialog(bidData, popupName){
		var newScope = $rootScope.$new();
		newScope.bidData = bidData;
		newScope.formFlag = true;
		Modal.openDialog(popupName,newScope);
	}

    // Rating
	$scope.rate = 1;
	$scope.max = 5;
	$scope.isReadonly = false;

	$scope.hoveringOver = function(value) {
	$scope.overStar = value;
	$scope.percent = 100 * (value / $scope.max);
		};

	$scope.ratingStates = [
	{stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'}
		];
	console.log($scope.percent);
	
    function onTabChange(tabs){
	  	switch(tabs){
	  		case 'auctionable':
	  		$scope.pager.reset();
	  		filter={};
			angular.copy(initFilter, filter);
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		filter.offerStatus = offerStatuses[0];
	  		vm.activeBid='Auctionable';
	        $scope.subTabValue='auctionable';
	  		getBidData(filter);
	  		break;
	  		case 'closed':
	  		$scope.pager.reset();
	  		filter={};
	  		angular.copy(initFilter, filter);
			vm.activeBid='closed';
	  		$scope.subTabValue='closed';
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		filter.offerStatus = offerStatuses[2];
	  		//filter.assetStatus = encodeURIComponent('closed');
	  		getBidData(filter);
	  		break;
	  	}
  	}

	function withdrawBid(bidId) {
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }
      var data = {};
      data._id = bidId;
      Modal.confirm("Do you want to withdrawn bid?", function(ret) {
        if (ret == "yes") {
          AssetSaleSvc.withdrawBid(data)
          .then(function(res) {
            if(res && res.msg)
              Modal.alert(res.msg, true);
          	//getBidData(filter);
          })
          .catch(function(err) {
          });
        }
      });
    }

	function fireCommand(reset, filterObj) {
		if (reset)
			$scope.pager.reset();
		var filter = {};
		if (!filterObj)
			angular.copy(dataToSend, filter);
		else
			filter = filterObj;
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}

		getBidData(filter);
	}

	function getBidData(filter) {
		$scope.pager.copy(filter);
		AssetSaleSvc.fetchBid(filter)
			.then(function(res) {
				console.log("res", res);
				vm.bidListing = res.items;
				vm.totalItems = res.totalItems;
				$scope.pager.update(res.items, res.totalItems);
			})
			.catch(function(err) {

			});

	}

	//loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}
})();