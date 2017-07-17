(function() {
	'use strict';
	angular.module('sreizaoApp').controller('AssetSaleCtrl', AssetSaleCtrl);

	function AssetSaleCtrl($scope, Auth,productSvc, AssetSaleSvc) {
		var vm = this;
		var filter={};
		vm.bidListing=[];
		vm.activeBid="Auctionable";
		$scope.tabValue='auctionable';
		$scope.onTabChange=onTabChange;
		vm.fireCommand=fireCommand;

		function init() {
			switch($state.current.name){
            case 'assetsale.administrator':
                $scope.tabValue = 'administrator';
            break;
            case 'assetsale.seller':
                $scope.tabValue = 'seller';
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
			/*Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {

					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
						$scope.isAdmin = false;
						$scope.tabValue='seller';
						$state.go('seller');
					}
					getBidProducts(filter);
				}
			});*/
		}
		init();
	  
	  function onTabChange(tabValue){
      switch(tabValue){
        case "administrator":
          $scope.tabValue = 'dashboard';
          $state.go("assetsale.administrator");
        break;
        case "seller":
          $scope.tabValue = 'seller';
          $state.go("assetsale.seller");
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

   /* function getBidProducts(filter){
    	filter.userid=Auth.getCurrentUser()._id;
    	productSvc.getProductOnSellerId(filter)
						.then(function(res) {
							console.log("res", res);
							vm.bidListing=res;
						})
						.catch(function(err) {

						});
    
    }*/

	}
})();