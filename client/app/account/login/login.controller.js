(function(){
  'use strict';

angular.module('account').controller('LoginCtrl', LoginCtrl);

  function LoginCtrl($scope, Auth, $location, CartSvc,$window,$rootScope,$uibModal,$uibModalInstance, $state,MarketingSvc) {
    var vm = this;
    var facebookConversionSent = false;
    vm.user = {};
    vm.login = login;
    vm.loginOauth = loginOauth;
    vm.openRegister = openRegister;
    vm.forgotPassword = forgotPassword;
    vm.closeDialog = closeDialog;

    $scope.errors = {};

    function login(form) {
      $scope.submitted = true;
      var dataToSend = {};
      dataToSend['userId'] = vm.user.userId;
      dataToSend['password'] = vm.user.password;
      //dataToSend['isManpower'] = false;
      if(form.$valid) {
        Auth.login(dataToSend)
        .then( function() {
          closeDialog();
          vm.user = {};
          //Google and Facbook conversion start
            MarketingSvc.googleConversion();
            if(!facebookConversionSent){
                MarketingSvc.facebookConversion();
                facebookConversionSent = true;
            }
         //Google and Facbook conversion end

          /*Loading cart and other data if user is logged in*/
        $rootScope.loading = true;
         Auth.isLoggedInAsync(function(loggedIn){
           $rootScope.loading = false;
           if(loggedIn){
               if(Auth.getCurrentUser()._id){
                 //NJ: set currentUser id in sessionStorage and pass into GTM
                  $window.sessionStorage.currentUser = Auth.getCurrentUser()._id;
                  dataLayer.push({'userID': $window.sessionStorage.currentUser});
                 CartSvc.loadCart();
              }
              if(Auth.isAdmin()){
                if(!Auth.doNotRedirect)
                    $state.go('productlisting');
              }
              if(Auth.postLoginCallback)
                  Auth.postLoginCallback();
              if($state.current.name === "valuation")
                $rootScope.$broadcast('callValuationRequest');
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
