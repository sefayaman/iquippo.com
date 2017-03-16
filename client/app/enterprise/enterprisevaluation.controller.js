(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseValuationCtrl',EnterpriseValuationCtrl);
function EnterpriseValuationCtrl($scope, $rootScope, $state) {
  var vm = this;
    vm.onTabChange = onTabChange;
    vm.tabValue = 'dashboard';
    var viewSvc = null;
    function init() {
      //console.log("###", $state.current.name);
      switch($state.current.name){
            case 'enterprisevaluation.dashborad':
                vm.tabValue = 'dashboard';
            break;
            case 'enterprisevaluation.transaction':
                vm.tabValue = 'transaction';
            break;
            case 'enterprisevaluation.invoicing':
                vm.tabValue = 'invoicing';  
            break;
        }
        onTabChange(vm.tabValue);
    }

    init();

    function onTabChange(tabValue){
      switch(tabValue){
        case "dashboard":
          vm.tabValue = 'dashboard';
          $state.go("enterprisevaluation.dashborad");
        break;
        case "transaction":
          vm.tabValue = 'transaction';
          $state.go("enterprisevaluation.transaction");
        break;
        case "invoicing":
          vm.tabValue = 'invoicing';
          $state.go("enterprisevaluation.invoicing");
        break;

      } 
    }

}

})();
