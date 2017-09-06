(function() {
	'use strict';
	angular.module('sreizaoApp').controller('BidProductCtrl', BidProductCtrl);
function BidProductCtrl($scope, $rootScope, $state, Auth, productSvc, AssetSaleSvc,userSvc,PagerSvc, Modal) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	var initFilter = {};
	vm.dataList = [];
	vm.activeBid = "actionable";
	$scope.onTabChange = onTabChange;
	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	vm.exportExcel = exportExcel;
	
	function init() {

		initFilter.bidReceived = true;
		$scope.tabValue = Auth.isAdmin()?'administrator':'seller';
		if(!Auth.isAdmin())
		 	initFilter.userid = Auth.getCurrentUser()._id;
		if(Auth.isEnterprise()|| (Auth.isEnterpriseUser() && Auth.isBuySaleApprover())){
			delete initFilter.userid;
			initFilter.enterpriseId = Auth.getCurrentUser().enterpriseId;
		}

	    var filter = angular.copy(initFilter);
	    filter.bidRequestApproved = 'n';
		getBidProducts(filter);
	}


	function onTabChange(tab) {
		vm.activeBid = tab;
		fireCommand(true);
	}

	function fireCommand(reset) {
		if(reset)
			$scope.pager.reset();
		var filter = angular.copy(initFilter);
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchstr = encodeURIComponent(vm.searchStr);
		}
		
		if(vm.activeBid === 'actionable'){
			filter.bidRequestApproved = 'n';
			getBidProducts(filter);
		}
		else if(vm.activeBid === 'saleinprocess'){
			filter.bidRequestApproved = 'y';
			getBidProducts(filter);
		}else
		 getClosedBids(filter);			
	}

	function getBidProducts(filter) {
		$scope.pager.copy(filter);
		filter.pagination = true;
		AssetSaleSvc.getBidProduct(filter)
			.then(function(result) {
				vm.dataList = result.products;
				$scope.pager.update(result.prodcuts,result.totalItems);
			})
			.catch(function(err) {

			});
	}

	function getClosedBids(filter){
		$scope.pager.copy(filter);
		filter.actionable = 'n';
		filter.dealStatus = dealStatuses[12];
		filter.pagination = true;
		AssetSaleSvc.get(filter)
		.then(function(result){
			vm.dataList = result.items;
			$scope.pager.update(result.items,result.totalItems);
		});
	}

	function openDialog(data, popupName, modalClass, viewBlock){
		var newScope = $rootScope.$new();
		newScope.data = data;
		newScope.viewBlock = viewBlock;
		Modal.openDialog(popupName,newScope,modalClass);
	}

	function exportExcel(allReport) {
		var exportFilter = {};
		angular.copy(initFilter, exportFilter)
		if(vm.activeBid === 'actionable' || vm.activeBid === 'saleinprocess') {
			if(vm.dataList) {
				exportFilter.productIds = [];
				vm.dataList.forEach(function(item) {
	              exportFilter.productIds.push(item._id);
	            });
			}
		} else {
			exportFilter.actionable = 'n';
			exportFilter.dealStatuses = dealStatuses[12];
		}
		if(allReport === 'all'){
			exportFilter = {};
			angular.copy(initFilter, exportFilter);
		}
		if(allReport === 'payment'){
			exportFilter = {};
			angular.copy(initFilter, exportFilter);
			exportFilter.payment = 'y'
		}

		if(!Auth.isAdmin())
        	exportFilter.seller = 'y';
		AssetSaleSvc.exportExcel(exportFilter);
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