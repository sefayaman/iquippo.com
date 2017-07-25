(function() {
  'use strict';

angular.module('sreizaoApp').controller('AdminRequestDetailCtrl', AdminRequestDetailCtrl);

function AdminRequestDetailCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();