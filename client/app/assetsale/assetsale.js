(function(){
'use strict';
angular.module('sreizaoApp').controller('AssetSaleCtrl',AssetSaleCtrl);
function AssetSaleCtrl($scope, $rootScope, $state,$window) {
    var vm = this;
    $scope.onTabChange = onTabChange;
    $scope.tabValue = 'administrator';
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
           case "assetsale.paymentreceived":
              $scope.tabValue = 'paymentreceived';
            break;
             case "assetsale.paymentmade":
              $scope.tabValue = 'paymentmade';
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
         case "paymentreceived":
          $scope.tabValue = 'paymentreceived';
          $state.go("assetsale.paymentreceived");
        break;
         case "paymentmade":
          $scope.tabValue = 'paymentmade';
          $state.go("assetsale.paymentmade");
        break;

      } 
    }

}

})();
