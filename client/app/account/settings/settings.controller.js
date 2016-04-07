(function(){
  'use strict';
angular.module('account').controller('SettingsCtrl',SettingsCtrl);

function SettingsCtrl($scope, $rootScope, User, Auth,$uibModalInstance,Modal) {
    var vm = this;

    vm.data = {};
    vm.changePassword = changePassword;
    vm.closeDialog = closeDialog;

    $scope.errors = {};
  function changePassword(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.changePassword(vm.data.oldPassword, vm.data.newPassword)
        .then( function() {
          $scope.message = 'Password successfully changed.';
          closeDialog();
          Modal.alert($scope.message,true);
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
      }
    };

    function closeDialog() {
     $uibModalInstance.dismiss('cancel');
    };
  }

})();
