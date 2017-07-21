(function() {
  'use strict';

angular.module('sreizaoApp').controller('invoiceDetailsCtrl', invoiceDetailsCtrl);

function invoiceDetailsCtrl($scope, $rootScope,Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;
  vm.submit = submit;

  function submit() {
    
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();