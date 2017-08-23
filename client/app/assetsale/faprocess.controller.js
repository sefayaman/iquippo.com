(function() {
	'use strict';
	angular.module('sreizaoApp').controller('FAProcessCtrl', FAProcessCtrl);
function FAProcessCtrl($scope, $rootScope, $state, Auth, productSvc, AssetSaleSvc,userSvc,PagerSvc, Modal) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	//var initFilter = {};
	vm.dataList = [];
	vm.tabVal = "approved";
	$scope.onTabChange = onTabChange;
	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	vm.validateAction = AssetSaleSvc.validateAction;
	vm.update = update;
	vm.exportExcel = exportExcel;
	var initFilter = {actionable : 'y'};
	
	function init() {
		if(!Auth.isFAgencyPartner())
			$state.go('main');
		$scope.tabValue = 'fulfilmentagency';
		initFilter.userType = 'FA';
		if(Auth.getCurrentUser().partnerInfo.defaultPartner)
			initFilter.defaultPartner = 'y';
		else
			initFilter.defaultPartner = 'n';
        initFilter.partnerId = Auth.getCurrentUser().partnerInfo.partnerId;
		getApprovedBids(angular.copy(initFilter));
	}


	function onTabChange(tab) {
		vm.tabVal = tab;
		fireCommand(true);
	}

	function fireCommand(reset) {
		if(reset)
			$scope.pager.reset();
		var filter = angular.copy(initFilter);
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		if(vm.tabVal === 'approved')
			getApprovedBids(filter);
		else if(vm.tabVal === 'closed')
			getClosedBids(filter);
		else
			getBidProducts(filter);

		/*if(vm.activeBid === 'auctionable')
			getBidProducts(filter);
		else
			getClosedBids(filter);	*/		
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

	function getApprovedBids(filter){
		$scope.pager.copy(filter);
		filter.actionable = 'y';
		filter.dealStatuses = dealStatuses.slice(6,12);
		filter.bidStatus = bidStatuses[7];
		//filter.dealStatus = dealStatuses[12];
		filter.pagination = true;
		AssetSaleSvc.get(filter)
		.then(function(result){
			vm.dataList = result.items;
			$scope.pager.update(result.items,result.totalItems);
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

	function update(bid,action,cb){
		
		Modal.confirm(StatusChangeConfirmationMsg[action],function(retVal){
			if(retVal === 'yes')
				AssetSaleSvc.changeBidStatus(bid,action,cb || fireCommand);				
		});
	}

	function openDialog(bidData, popupName, modalClass, formType){
		var newScope = $rootScope.$new();
		newScope.bidData = bidData;
		if(formType)
			newScope.formType = formType;
		Modal.openDialog(popupName,newScope,modalClass);
	}

	function exportExcel() {
		var filter = {};
		angular.copy(initFilter, filter)
        filter.fa = 'y';
        AssetSaleSvc.exportExcel(filter);
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