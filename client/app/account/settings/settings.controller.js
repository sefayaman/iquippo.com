'use strict';

angular.module('sreizaoApp')
  .controller('SettingsCtrl', function ($scope, $rootScope, User, Auth,$uibModalInstance,Modal) {
    $scope.errors = {};
    $scope.changePassword = function(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.changePassword($scope.user.oldPassword, $scope.user.newPassword)
        .then( function() {
          $scope.message = 'Password successfully changed.';
          $scope.closeDialog();
          Modal.alert($scope.message,true);
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
      }
		};

    $scope.closeDialog = function () {
     $uibModalInstance.dismiss('cancel');
    };
  });
