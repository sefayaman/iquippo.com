(function() {
	'use strict';
	angular.module('sreizaoApp').controller('ProductBidRequestCtrl', ProductBidRequestCtrl);
function ProductBidRequestCtrl($scope, $rootScope, $window, $uibModal, $stateParams,$state, productSvc, socketSvc, Modal, Auth, AssetSaleSvc,PagerSvc,uploadSvc) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	$scope.assetId = $stateParams.assetId;
	$scope.bidStatuses = bidStatuses;
	$scope.tab = $stateParams.tab;

	var initFilter = {actionable : 'y'};
	vm.bidListing = [];

	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	
	vm.update = update;
	//vm.exportExcel = exportExcel;
	vm.validateAction = AssetSaleSvc.validateAction;
	$scope.dayDiff = AssetSaleSvc.ageingOfAssetInPortal;
	vm.backButton = backButton;
	//vm.activeBid = "approved";
	//$scope.onTabChange = onTabChange;
        
        socketSvc.on('onSubmitBidSocket', function (data) {
            $scope.pager.reset();
            getBidData(angular.copy(initFilter));
        });
        socketSvc.on('onSystemUpdateBidSocket', function (data) {
            $scope.pager.reset();
            getBidData(angular.copy(initFilter));
        });
        
	function backButton() {
            $window.history.back();
        }
	function init() {
		var filter = {};
		filter._id = $stateParams.productId;
		productSvc.getProductOnFilter(filter).then(function(result) {
		 	if(!result)
		 		return;
	    	$scope.currentProduct = result[0];
	    	initFilter.productId = $stateParams.productId;
			if(Auth.isFAgencyPartner())
				initFilter.bidStatus = bidStatuses[7];
			getBidData(angular.copy(initFilter));
	  	});
	}

	/*function onTabChange(tab){
    	vm.activeBid = tab;
    	vm.searchStr = "";
    	var filter={};
    	$scope.pager.reset();
	  	switch(tab){
	  		case 'approved':
			angular.copy(initFilter, filter);
			filter.actionable = 'y';
	  		getBidData(filter);
	  		break;
	  		case 'closed':
	  		angular.copy(initFilter, filter);
			filter.actionable = 'n';
	  		getBidData(filter);
	  		break;
	  		case 'allbid':
	  		angular.copy(initFilter, filter);
			filter.actionable = 'n';
			vm.bidListing = [];
	  		getBidData(filter);
	  		break;
	  	}
  	}*/

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

	function update(bid,action,cb){

		Modal.confirm(StatusChangeConfirmationMsg[action],function(retVal){
			if(retVal === 'yes')
				AssetSaleSvc.changeBidStatus(bid,action,cb || fireCommand);				
		});
	}

	function getBidData(filter) {
		
		$scope.pager.copy(filter);
		filter.pagination = true;
		AssetSaleSvc.get(filter)
			.then(function(res) {
				$scope.approvFlag = false;
				if(!Auth.isAdmin()) {
					for(var i = 0;i < res.items.length;i++){
				      if([bidStatuses[7],bidStatuses[8]].indexOf(res.items[i].bidStatus) !== -1){
				        $scope.approvFlag = true;
				        break;
				      }
				    }
				}
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

	/*function exportExcel() {
		var filter = {};
		angular.copy(initFilter, filter);
		if(!Auth.isAdmin())
        	filter.seller = 'y';
		AssetSaleSvc.exportExcel(filter);
	}*/

	//loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}
})();