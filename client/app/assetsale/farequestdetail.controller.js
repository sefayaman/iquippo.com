(function() {
  'use strict';

angular.module('sreizaoApp').controller('FaRequestDetailCtrl', FaRequestDetailCtrl);

function FaRequestDetailCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;
  
  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();