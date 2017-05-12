(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseValuationCtrl',EnterpriseValuationCtrl);
function EnterpriseValuationCtrl($scope, $rootScope, $state,$window) {
    var vm = this;
    $scope.onTabChange = onTabChange;
    $scope.tabValue = 'dashboard';
    var viewSvc = null;
    $scope.downloadFile = downloadFile;
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
           case "enterprisevaluation.paymentreceived":
              $scope.tabValue = 'paymentreceived';
            break;
             case "enterprisevaluation.paymentmade":
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

    function downloadFile(fileObj,assetDir){
      var url = "";
      if(fileObj.external)
        url = fileObj.filename;
      else if(assetDir)
        url = "/download/" + assetDir + "/" + fileObj.filename + "/imageFile";
      else
        url = "";
      if(url)
        $window.open(url,'_blank');
    }

}

})();
