(function() {
	'use strict';
	angular.module('sreizaoApp').controller('AssetSaleCtrl', AssetSaleCtrl);

	function AssetSaleCtrl($scope, $state,$location, Auth, AssetSaleSvc) {
		var vm = this;
		var filter={};
		vm.bidListing=[];
		vm.activeBid="Auctionable";
		$scope.tabValue='auctionable';
		$scope.onTabChange=onTabChange;

		function init() {
      if(Auth.isEnterpriseUser() && !Auth.isBuySaleViewOnly())
        return $state.go('main');

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
        onTabChange($scope.tabValue,false);
		}
		init();
	  
	  function onTabChange(tabValue,tabReset){
      var t = $location.search().t || 1;
      if(tabReset)
         t = 1;
       
      switch(tabValue){
        case "administrator":
          $scope.tabValue = 'administrator';
          $state.go("assetsale.bidproduct",{t:t});
        break;
        case "seller":
          $scope.tabValue = 'seller';
          $state.go("assetsale.bidproduct",{t:t});
        break;
        case "buyer":
          $scope.tabValue = 'buyer';
          $state.go("assetsale.buyer",{t:t});
        break;
         case "fulfilmentagency":
          $scope.tabValue = 'fulfilmentagency';
          $state.go("assetsale.fulfilmentagency",{t:t});
        break;
      } 
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