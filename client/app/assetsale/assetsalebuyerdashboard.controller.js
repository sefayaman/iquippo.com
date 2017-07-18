(function() {
	'use strict';
	angular.module('sreizaoApp').controller('AssetSaleBuyerDashboardCtrl', AssetSaleBuyerDashboardCtrl);

	function AssetSaleBuyerDashboardCtrl($scope, Auth, PagerSvc, AssetSaleSvc) {
		var vm = this;
		var filter = {};
		var dataToSend={};
		vm.bidListing = [];
		vm.activeBid = "Auctionable";
		$scope.tabValue = 'auctionable'
		$scope.onTabChange = onTabChange;
		vm.withdrawBid = withdrawBid;
		vm.fireCommand = fireCommand;
		$scope.pager = PagerSvc.getPager();

		function init() {
			Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {
					filter = {};
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
						$scope.isAdmin = false;
						filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
					}
					getBidData(filter);
				}
			});
		}
		init();
	  
	  function onTabChange(tabs){
	  	switch(tabs){
	  		case 'auctionable':
	  		filter={};
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		vm.activeBid='Auctionable';
            $scope.tabValue='auctionable';
	  		getBidData(filter);
	  		break;
	  		case 'closed':
	  		filter={};
	  		vm.activeBid='closed';
	  		$scope.tabValue='closed';
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		filter.assetStatus = encodeURIComponent('closed');
	  		getBidData(filter);
	  		break;
	  	}
	  }

	function withdrawBid(bid) {
		if (bid) {
			filter._id = bid;
			filter.offerStatus = offerStatuses[2];
			filter.dealStatus = dealStatuses[12];
			filter.bidStatus = bidStatuses[8];
		}
		AssetSaleSvc.withdrawBid(filter)
			.then(function(res) {
				getBidData(filter);
			})
			.catch(function(err) {

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
		$scope.pager.copy(filter);
		filter.pagination = true;
		filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
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
}
})();