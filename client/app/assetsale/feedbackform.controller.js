(function() {
  'use strict';

angular.module('sreizaoApp').controller('feedbackCtrl', feedbackCtrl);

function feedbackCtrl($scope, $rootScope, Modal, Auth, UtilSvc, $uibModal, $uibModalInstance, AssetSaleSvc) {
  var vm = this;
  vm.feedback = {};
  vm.closeDialog = closeDialog;
  vm.submit = submit;
  
  function submit(form) {
    if(form.$invalid){
      form.submitted = true;
      return;
    }
    
    $scope.bidData.comment = vm.feedback.comment;
    AssetSaleSvc.update($scope.bidData, 'feedback').
      then(function(res) {
        if (res)
          Modal.alert("Thank You for your valuable feedback.", true);
        closeDialog();
      })
      .catch(function(res) {
        console.log(res);
      });
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();