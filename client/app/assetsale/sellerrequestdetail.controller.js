(function() {
  'use strict';

angular.module('sreizaoApp').controller('SellerRequestDetailCtrl', SellerRequestDetailCtrl);

function SellerRequestDetailCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;
  
  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();