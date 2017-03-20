(function(){
  'use strict';
angular.module('account').controller('SettingsCtrl',SettingsCtrl);

function SettingsCtrl($scope, $rootScope,LocationSvc, User, Auth,$uibModalInstance,Modal, notificationSvc) {
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
          var data = {};
          data['to'] = Auth.getCurrentUser().email;
          data['subject'] = 'Password Changed: Success';
          var dataToSend = {};
          dataToSend['fname'] = Auth.getCurrentUser().fname; 
          dataToSend['lname'] = Auth.getCurrentUser().lname;
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('userPasswordChangedEmail', data, dataToSend,'email');
          data['to'] = Auth.getCurrentUser().mobile;
          data['countryCode']=LocationSvc.getCountryCode(Auth.getCurrentUser().country);
          notificationSvc.sendNotification('passwordChangesSmsToUser', data, dataToSend,'sms');
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
