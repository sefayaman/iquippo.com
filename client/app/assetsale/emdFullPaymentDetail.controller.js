(function() {
  'use strict';

angular.module('sreizaoApp').controller('EmdFullPaymentCtrl', EmdFullPaymentCtrl);

function EmdFullPaymentCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
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