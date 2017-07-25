(function() {
  'use strict';

angular.module('sreizaoApp').controller('BuyerRequestDetailCtrl', BuyerRequestDetailCtrl);

function BuyerRequestDetailCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();