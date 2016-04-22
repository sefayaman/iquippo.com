(function(){
  'use strict';

angular.module('account').controller('LoginCtrl', LoginCtrl);

  function LoginCtrl($scope, Auth, $location, cartSvc,$window,$rootScope,$uibModal,$uibModalInstance, $state) {
    var vm = this;
    vm.user = {};
    vm.login = login;
    vm.loginOauth = loginOauth;
    vm.openRegister = openRegister;
    vm.forgotPassword = forgotPassword;
    vm.closeDialog = closeDialog;

    $scope.errors = {};

    function login(form) {
      $scope.submitted = true;
      if(form.$valid) {
        Auth.login({
          email: vm.user.email,
          password: vm.user.password
        })
        .then( function() {
          closeDialog();
          vm.user = {};

          /*Loading cart and other data if user is logged in*/
        $rootScope.loading = true;
         Auth.isLoggedInAsync(function(loggedIn){
           $rootScope.loading = false;
           if(loggedIn){
               if(Auth.getCurrentUser()._id){
                 cartSvc.getCartData(Auth.getCurrentUser()._id);
              }
              if(Auth.isAdmin()){
                if(!Auth.doNotRedirect)
                    $state.go('productlisting');
              }
              if(Auth.postLoginCallback)
                  Auth.postLoginCallback();

           }
         });
        
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

    function loginOauth(provider) {
      $window.location.href = '/auth/' + provider;
    };

     function openRegister(){
          closeDialog();
          $scope.openDialog('signup');
    };

    function forgotPassword(){
        closeDialog();
        $scope.openDialog('forgotpassword');
    };

    function closeDialog() {
     $uibModalInstance.dismiss('cancel');
    };
    
  }


})();
