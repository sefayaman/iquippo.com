(function() {
	'use strict';
	angular.module('sreizaoApp').controller('BidProductCtrl', BidProductCtrl);
function BidProductCtrl($scope, $state, Auth, productSvc, AssetSaleSvc) {
	var vm = this;
	var filter = {};
	vm.bidListing = [];
	vm.activeBid = "Auctionable";
	$scope.subTabValue = 'auctionable'
	$scope.onTabChange = onTabChange;
	vm.fireCommand = fireCommand;

	function init() {
		switch($state.current.name){
            case 'assetsale.administrator':
            	filter = {};
                $scope.tabValue = 'administrator';
            break;
            case 'assetsale.seller':
	            filter = {};
				if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
					$scope.isAdmin = false;
					filter.userid = Auth.getCurrentUser()._id;
				}
                $scope.tabValue = 'seller';
            break;
            case "assetsale.fulfilmentagency":
                filter = {};
				if (Auth.getCurrentUser().mobile && Auth.isFAgencyPartner()) {
					$scope.isAdmin = false;
					filter.mobile = Auth.getCurrentUser().mobile;
					//getBidProducts(filter);
				}
				//if(Auth.isAdmin())
					//getBidProducts(filter);
                $scope.tabValue = 'fulfilmentagency';
            break;
	            /*default:
	              $scope.tabValue = '';
	              break;*/
	    }
		getBidProducts(filter);
	}


	function onTabChange(tabs) {
		switch (tabs) {
			case 'auctionable':
				filter = {};
				if($scope.tabValue == 'seller') {
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
						filter.userid = Auth.getCurrentUser()._id;
					vm.activeBid = 'Auctionable';
					$scope.subTabValue = 'auctionable';
				} else if($scope.tabValue == 'fulfilmentagency') {
					if (Auth.getCurrentUser().mobile && Auth.isFAgencyPartner()) 
						filter.mobile = Auth.getCurrentUser().mobile;
					// if(Auth.isAdmin())
					// 	filter = {};
					vm.activeBid = 'Auctionable';
					$scope.subTabValue = 'auctionable';
				}
				getBidProducts(filter);
				break;
			case 'closed':
				filter = {};
				if($scope.tabValue == 'seller') {
					vm.activeBid = 'closed';
					$scope.subTabValue = 'closed';
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
						filter.userid = Auth.getCurrentUser()._id;
					filter.tradeType = "NOT_AVAILABLE";
					filter.assetStatus = "sold";
				} else if($scope.tabValue == 'fulfilmentagency') {
					vm.activeBid = 'closed';
					$scope.subTabValue = 'closed';
					if (Auth.getCurrentUser().mobile && Auth.isFAgencyPartner()) 
						filter.mobile = Auth.getCurrentUser().mobile;
					// if(Auth.isAdmin())
					// 	filter = {};
					//filter.assetStatus = encodeURIComponent('closed');
					//filter.tradeType = "NOT_AVAILABLE";
					//filter.assetStatus = "sold";
				}
				getBidProducts(filter);
				break;
		}
	}

	function fireCommand(reset, filterObj) {
		/*if(reset)
		  $scope.pager.reset();*/
		var filter = {};
		/*if(!filterObj)
		    angular.copy(dataToSend, filter);
		else
		  filter = filterObj;*/
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		/*if(vm.statusType){
		  filter.isSearch = true;
		  filter['statusType'] = encodeURIComponent(vm.statusType);
		}
		if(vm.fromDate){
		  filter.isSearch = true;
		  filter['fromDate'] = encodeURIComponent(vm.fromDate);
		}
		if(vm.toDate){
		  filter.isSearch = true;
		  filter['toDate'] = encodeURIComponent(vm.toDate);
		}*/

		getBidProducts(filter);
	}


	function getBidProducts(filter) {
		productSvc.getProductOnSellerId(filter)
			.then(function(res) {
				console.log("res", res);
				vm.productListing = res;
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