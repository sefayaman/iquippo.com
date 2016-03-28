'use strict';

angular.module('sreizaoApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, cartSvc,$window,$rootScope,$uibModal,$uibModalInstance, $state) {
    $scope.user = {};
    $scope.errors = {};

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          $scope.closeDialog();
         $scope.user = {};
          /*Loading cart and other data if user is logged in*/
          $rootScope.loading = true;
         Auth.isLoggedInAsync(function(loggedIn){
           $rootScope.loading = false;
           if(loggedIn){
               if(Auth.getCurrentUser()._id){
                 cartSvc.getCartData(Auth.getCurrentUser()._id);
              }
              if(Auth.isAdmin())
                $state.go('productlisting');
           }
         });
        
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

    $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

     $scope.openRegister = function(){
          $scope.closeDialog();
          $scope.openDialog('signup');
    };

    $scope.forgotPassword = function(){
         $scope.closeDialog();
          $scope.openDialog('forgotpassword');
    };

    $scope.closeDialog = function () {
     $uibModalInstance.dismiss('cancel');
    };
    
  });
