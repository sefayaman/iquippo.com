(function() {
	'use strict';
	angular.module('sreizaoApp').controller('AssetSaleSellerDashboardCtrl', AssetSaleSellerDashboardCtrl);

	function AssetSaleSellerDashboardCtrl($scope, Auth, productSvc, AssetSaleSvc) {
		var vm = this;
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
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
						$scope.isAdmin = false;
						filter.userid = Auth.getCurrentUser()._id;
					}
					getBidProducts(filter);
				}
			});
		}
		init();

		function onTabChange(tabs) {
			switch (tabs) {
				case 'auctionable':
					filter = {};
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
						filter.userid = Auth.getCurrentUser()._id;
					vm.activeBid = 'Auctionable';
					$scope.tabValue = 'auctionable';
					getBidProducts(filter);
					break;
				case 'closed':
					filter = {};
					vm.activeBid = 'closed';
					$scope.tabValue = 'closed';
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
						filter.userid = Auth.getCurrentUser()._id;
					//filter.assetStatus = encodeURIComponent('closed');
					filter.tradeType = "NOT_AVAILABLE";
					filter.assetStatus = "sold";
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

	}
})();