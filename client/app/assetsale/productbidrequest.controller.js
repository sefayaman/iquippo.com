(function() {
	'use strict';
	angular.module('sreizaoApp').controller('ProductBidRequestCtrl', ProductBidRequestCtrl);
function ProductBidRequestCtrl($scope, $location, Auth, AssetSaleSvc) {
	var vm = this;
	var query = $location.search();
	$scope.assetId = $location.search().assetId;
	var filter = {};
	vm.bidListing = [];
	vm.activeBid = "Auctionable";
	$scope.subTabValue = 'auctionable'
	$scope.onTabChange = onTabChange;
	vm.fireCommand = fireCommand;

	function init() {
		filter = {};
		filter.productId = query.productId;
		getBidData(filter);
	}

	function onTabChange(tabs) {
		switch (tabs) {
			case 'auctionable':
				filter = {};
				filter.productId = query.productId;
				vm.activeBid = 'Auctionable';
				$scope.subTabValue = 'auctionable';
				getBidData(filter);
				break;
			case 'closed':
				filter = {};
				vm.activeBid = 'closed';
				$scope.subTabValue = 'closed';
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

	//loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}
})();