(function() {
	'use strict';
	angular.module('sreizaoApp').controller('FAProductDashboardCtrl', FAProductDashboardCtrl);
	angular.module('sreizaoApp').controller('FAProDetailDashboardCtrl', FAProDetailDashboardCtrl);

	function FAProductDashboardCtrl($scope, Auth, productSvc, AssetSaleSvc) {
		var vm = this;
		var filter = {};
		vm.agencyListing = [];
		vm.activeBid = "Auctionable";
		$scope.tabValue = 'auctionable'
		$scope.onTabChange = onTabChange;
		vm.fireCommand = fireCommand;

		function init() {
			Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {
					filter = {};
					if (Auth.getCurrentUser().mobile && Auth.isFAgencyPartner()) {
						$scope.isAdmin = false;
						filter.mobile = Auth.getCurrentUser().mobile;
						getBidProducts(filter);
					}
					if(Auth.isAdmin())
						getBidProducts(filter);
				}
			});
		}
		init();

		function onTabChange(tabs) {
			switch (tabs) {
				case 'auctionable':
					filter = {};
					if (Auth.getCurrentUser().mobile && Auth.isFAgencyPartner()) 
						filter.mobile = Auth.getCurrentUser().mobile;
					if(Auth.isAdmin())
						filter = {};
					vm.activeBid = 'Auctionable';
					$scope.tabValue = 'auctionable';
					getBidProducts(filter);
					break;
				case 'closed':
					filter = {};
					vm.activeBid = 'closed';
					$scope.tabValue = 'closed';
					if (Auth.getCurrentUser().mobile && Auth.isFAgencyPartner()) 
						filter.mobile = Auth.getCurrentUser().mobile;
					if(Auth.isAdmin())
						filter = {};
					//filter.assetStatus = encodeURIComponent('closed');
					//filter.tradeType = "NOT_AVAILABLE";
					//filter.assetStatus = "sold";
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
			AssetSaleSvc.fetchFAData(filter)
			.then(function(res) {
				vm.agencyListing = res;
	            //vm.totalItems = res.totalItems;
	          // $scope.pager.update(res.items,res.totalItems);

				//console.log(vm.agencyListing); 
			})
			.catch(function(err) {
			});
		}

	}

	function FAProDetailDashboardCtrl($scope, $location, EnterpriseMasterSvc, Auth, AssetSaleSvc) {
		var vm = this;
		var query = $location.search();
		var filter = {};
		vm.bidListing = [];
		vm.activeBid = "Auctionable";
		$scope.tabValue = 'auctionable'
		$scope.onTabChange = onTabChange;
		vm.fireCommand = fireCommand;

		function init() {
			Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {
					filter = {};
					filter.productId = query.productId;
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
						$scope.isAdmin = false;
					}
					getBidData(filter);
					//fetchCoolingPeriod();
				}
			});
		}
		init();

		function onTabChange(tabs) {
			switch (tabs) {
				case 'auctionable':
					filter = {};
					filter.productId = query.productId;
					vm.activeBid = 'Auctionable';
					$scope.tabValue = 'auctionable';
					getBidData(filter);
					break;
				case 'closed':
					filter = {};
					vm.activeBid = 'closed';
					$scope.tabValue = 'closed';
					filter.productId = query.productId;
					filter.assetStatus = encodeURIComponent('closed');
					getBidData(filter);
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

			getBidData(filter);
		}


		function getBidData(filter) {
			AssetSaleSvc.fetchBid(filter)
				.then(function(res) {
					console.log("res", res);
					vm.bidListing = res;
				})
				.catch(function(err) {

				});

		}

		/*function fetchCoolingPeriod() {
			filter={};
			EnterpriseMasterSvc.get(filter)
				.then(function(res) {
					console.log("fetchCoolingPeriod", res);
				})
				.catch(function(err) {

				});
		}*/

	}
})();