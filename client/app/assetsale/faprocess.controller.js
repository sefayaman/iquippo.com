(function() {
	'use strict';
	angular.module('sreizaoApp').controller('FAProcessCtrl', FAProcessCtrl);
function FAProcessCtrl($scope, $rootScope, $state, Auth, productSvc, AssetSaleSvc,userSvc,PagerSvc, Modal) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	var initFilter = {};
	vm.dataList = [];
	vm.tabVal = "approved";
	$scope.onTabChange = onTabChange;
	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;

	function init() {
		if(!Auth.isFAgencyPartner())
			$state.go('main');
		//initFilter.bidReceived = true;
		/*switch($state.current.name){
            case 'assetsale.administrator':
                $scope.tabValue = 'administrator';
            break;
            case 'assetsale.seller':
				if (!Auth.isAdmin()) {
					initFilter.userid = Auth.getCurrentUser()._id;
				}
                $scope.tabValue = 'seller';
            break;
            case "assetsale.fulfilmentagency":
            	$scope.tabValue = 'fulfilmentagency';
            	if(Auth.isFAgencyPartner()){
            		initFilter.userType = 'FA';
            		initFilter.partnerId = Auth.getCurrentUser().partnerInfo.partnerId;
            	}

            	if(!Auth.isFAgencyPartner() && !Auth.isAdmin())
            		$state.go('main');
            break;
	    }*/
		//getBidProducts(angular.copy(initFilter));
		$scope.tabValue = 'fulfilmentagency';
		getApprovedBids({});
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
		
		/*if(vm.activeBid === 'auctionable')
			getBidProducts(filter);
		else
			getClosedBids(filter);	*/		
	}


	function getBidProducts(filter) {
		$scope.pager.copy(filter);
		filter.pagination = true;
		filter.userType = 'FA';
        filter.partnerId = Auth.getCurrentUser().partnerInfo.partnerId;
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
		filter.status = 'y';
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
		filter.status = 'n';
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

	//loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});

}
})();