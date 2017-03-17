(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseValuationCtrl',EnterpriseValuationCtrl);
function EnterpriseValuationCtrl($scope, $rootScope, $state) {
    var vm = this;
    $scope.onTabChange = onTabChange;
    $scope.tabValue = 'dashboard';
    var viewSvc = null;
    function init() {
      switch($state.current.name){
            case 'enterprisevaluation.dashborad':
                $scope.tabValue = 'dashboard';
            break;
            case 'enterprisevaluation.transaction':
                $scope.tabValue = 'transaction';
            break;
            case 'enterprisevaluation.invoicing':
                $scope.tabValue = 'invoicing';  
            break;
        }
        onTabChange($scope.tabValue);
    }

    init();

    function onTabChange(tabValue){
      switch(tabValue){
        case "dashboard":
          $scope.tabValue = 'dashboard';
          $state.go("enterprisevaluation.dashborad");
        break;
        case "transaction":
          $scope.tabValue = 'transaction';
          $state.go("enterprisevaluation.transaction");
        break;
        case "invoicing":
          $scope.tabValue = 'invoicing';
          $state.go("enterprisevaluation.invoicing");
        break;
         case "paymentreceived":
          $scope.tabValue = 'paymentreceived';
          $state.go("enterprisevaluation.paymentreceived");
        break;
         case "paymentmade":
          $scope.tabValue = 'paymentmade';
          $state.go("enterprisevaluation.paymentmade");
        break;
          case "addtransaction":
          $scope.tabValue = '';
          $state.go("enterprisevaluation.addtransaction");
        break;

      } 
    }

}

})();
