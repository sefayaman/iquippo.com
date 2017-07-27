(function() {
	'use strict';
	angular.module('sreizaoApp').controller('ProductBidRequestCtrl', ProductBidRequestCtrl);
function ProductBidRequestCtrl($scope, $rootScope, $uibModal, $stateParams,$state, Modal, Auth, AssetSaleSvc,PagerSvc) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	$scope.assetId = $stateParams.assetId;
	$scope.bidStatuses = bidStatuses;

	var initFilter = {};
	vm.bidListing = [];

	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	vm.update = update;
	vm.validateAction = AssetSaleSvc.validateAction;
	vm.doupload = doupload;
	function init() {
		initFilter.productId = $stateParams.productId;
		getBidData(angular.copy(initFilter));
	}
	// do upload
	function doupload(){
		var scope = $rootScope.$new();
		scope.doupload = $scope.doupload;
		var doupload = $uibModal.open({
		  animation: true,
		    templateUrl: "doupload.html",
		    scope: scope,
		    size: 'lg'
		});

		scope.close = function () {
		  doupload.dismiss('cancel');
		};
	}

	function fireCommand(reset) {
		if(reset)
		  $scope.pager.reset();
		var filter = {};
		angular.copy(initFilter,filter);
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		getBidData(filter);
	}

	function update(bid,action){
		switch(action){
			case 'approve':
				AssetSaleSvc.setStatus(bid,bidStatuses[7],'bidStatus','bidStatuses');
			break;
			case 'reject':
				AssetSaleSvc.setStatus(bid,bidStatuses[6],'bidStatus','bidStatuses');
				AssetSaleSvc.setStatus(bid,dealStatuses[1],'dealStatus','dealStatuses');
			break;
			case 'emdpayment':
				if(bid.emdPayment.remainingPayment > 0){
					Modal.alert("EMD has not been fully paid.");
					return;
				}
				AssetSaleSvc.setStatus(bid,dealStatuses[7],'dealStatus','dealStatuses');
			break;
			case 'fullpayment':
				if(bid.emdPayment.remainingPayment > 0){
					Modal.alert("EMD has not been fully paid.");
					return;
				}
				AssetSaleSvc.setStatus(bid,dealStatuses[8],'dealStatus','dealStatuses');
			default:
				return;
			break
		}
		Modal.confirm("Do you want to update bid?",function(retVal){
			if(retVal === 'yes')
				updateBid(bid,action);				
		});
	}

	function updateBid(bid,action){
		AssetSaleSvc.update(bid,action)
		.then(function(res){
			getBidData(angular.copy(initFilter));
		})
		.catch(function(err){
			if(err)
				Modal.alert(err.data)
		});
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

	function openDialog(bidData, popupName, modalClass, formType){
		var newScope = $rootScope.$new();
		newScope.bidData = bidData;
		if(formType)
			newScope.formType = formType;
		Modal.openDialog(popupName,newScope,modalClass);
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