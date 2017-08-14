(function() {
	'use strict';
	angular.module('sreizaoApp').controller('AssetSaleCtrl', AssetSaleCtrl);

	function AssetSaleCtrl($scope, $state, Auth, AssetSaleSvc) {
		var vm = this;
		var filter={};
		vm.bidListing=[];
		vm.activeBid="Auctionable";
		$scope.tabValue='auctionable';
		$scope.onTabChange=onTabChange;

		function init() {
			switch($state.current.name){
            case 'assetsale.bidproduct':
                $scope.tabValue = Auth.isAdmin()?'administrator':'seller';
            break;
            case 'assetsale.buyer':
                $scope.tabValue = 'buyer';  
            break;
           case "assetsale.fulfilmentagency":
              $scope.tabValue = 'fulfilmentagency';
            break;
            default:
              $scope.tabValue = '';
              break;
        }
        onTabChange($scope.tabValue);
		}
		init();
	  
	  function onTabChange(tabValue){
      switch(tabValue){
        case "administrator":
          $scope.tabValue = 'administrator';
          $state.go("assetsale.bidproduct");
        break;
        case "seller":
          $scope.tabValue = 'seller';
          $state.go("assetsale.bidproduct");
        break;
        case "buyer":
          $scope.tabValue = 'buyer';
          $state.go("assetsale.buyer");
        break;
         case "fulfilmentagency":
          $scope.tabValue = 'fulfilmentagency';
          $state.go("assetsale.fulfilmentagency");
        break;
      } 
    }

	}
})();