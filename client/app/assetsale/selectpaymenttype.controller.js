(function() {
  'use strict';

angular.module('sreizaoApp').controller('selectPaymentType', selectPaymentType);

function selectPaymentType($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
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