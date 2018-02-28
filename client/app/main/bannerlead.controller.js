(function() {
  'use strict';

  angular.module('sreizaoApp').controller('BannerLeadCtrl', BannerLeadCtrl);

  function BannerLeadCtrl($scope, $rootScope, Auth, Modal,notificationSvc,$uibModalInstance) {
    var vm = this;
    vm.close = close;
    
    function close(){
      $uibModalInstance.dismiss('cancel');
    }

  }
})();