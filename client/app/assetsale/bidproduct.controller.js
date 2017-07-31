(function() {
	'use strict';
	angular.module('sreizaoApp').controller('BidProductCtrl', BidProductCtrl);
function BidProductCtrl($scope, $rootScope, $state, Auth, productSvc, AssetSaleSvc,userSvc,PagerSvc, Modal) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	var initFilter = {};
	vm.bidListing = [];
	vm.activeBid = "auctionable";
	$scope.onTabChange = onTabChange;
	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;

	function init() {

		initFilter.bidReceived = true;
		switch($state.current.name){
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
	    }
		getBidProducts(angular.copy(initFilter));
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
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		
		if(vm.activeBid === 'auctionable')
			getBidProducts(filter);
		else
			getClosedBids(filter);			
	}


	function getBidProducts(filter) {
		$scope.pager.copy(filter);
		AssetSaleSvc.getBidProduct(filter)
			.then(function(result) {
				vm.productListing = result.products;
				$scope.pager.update(result.prodcuts,result.totalItems);
			})
			.catch(function(err) {

			});
	}

	function getClosedBids(filter){
		$scope.pager.copy(filter);
		filter.status = false;
		filter.dealStatus = dealStatuses[12];
		AssetSaleSvc.get(filter)
		.then(function(result){
			vm.closedBids = result.items;
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