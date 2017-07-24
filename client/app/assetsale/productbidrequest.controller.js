(function() {
	'use strict';
	angular.module('sreizaoApp').controller('ProductBidRequestCtrl', ProductBidRequestCtrl);
function ProductBidRequestCtrl($scope, $rootScope, $stateParams,$state, Modal, Auth, AssetSaleSvc,PagerSvc) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	$scope.assetId = $stateParams.assetId;
	$scope.bidStatuses = bidStatuses;

	var filter = {};
	vm.bidListing = [];

	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	vm.update = update;
	vm.validateAction = AssetSaleSvc.validateAction;

	function init() {
		filter = {};
		filter.productId = $stateParams.productId;
		getBidData(filter);
	}


	function fireCommand(reset, filterObj) {
		if(reset)
		  $scope.pager.reset();
		var filter = {};
		if(!filterObj)
		    angular.copy(dataToSend, filter);
		else
		  filter = filterObj;
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		
		getBidData(filter);
	}

	function update(bid,action){
		switch(action){
			case 'approve':
				AssetSaleSvc.setStatus(bid,bidStatuses[1],'bidStatus','bidStatuses');
			break;
			case 'reject':
				AssetSaleSvc.setStatus(bid,bidStatuses[7],'bidStatus','bidStatuses');
				AssetSaleSvc.setStatus(bid,bidStatuses[9],'dealStatus','dealStatuses');
			break;
			default:
				return;
			break
		}
		AssetSaleSvc.update(bid,action)
		.then(function(res){
			getBidData(filter);
		})
		.catch(function(err){

		})
		
	}

	function getBidData(filter) {
		
		$scope.pager.copy(filter);
		filter.pagination = true;
		AssetSaleSvc.fetchBid(filter)
			.then(function(res) {
				vm.bidListing = res.items;
				$scope.pager.update(res.items,res.totalItems);
			})
			.catch(function(err) {
				
			});
	}

	function openDialog(bidData, popupName, formType){
		var newScope = $rootScope.$new();
		newScope.bidData = bidData;
		newScope.formFlag = true;
		if(formType)
			newScope.formType = formType;
		Modal.openDialog(popupName,newScope);
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