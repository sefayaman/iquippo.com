(function(){
    'user strict'

    angular.module('sreizaoApp').controller('InvitationAcceptCtrl',InvitationAcceptCtrl);

    function InvitationAcceptCtrl($scope, $rootScope, $state, $window, $location, $uibModal,Auth, Modal,InvitationSvc){
      var vm = this;
      var filter = {};
      vm.refUser = {};
      vm.codeExpire = false;
      vm.openRegisterModal = openRegisterModal;
      vm.downloadApp = downloadApp;
      
      function init(){
        $scope.refUserId = $location.search().ref_id;
        $scope.promoCode = $location.search().code;
        if($scope.refUserId) {
          filter['_id'] = $scope.refUserId;
          filter['code'] = $scope.promoCode;
        }
          InvitationSvc.checkCodeValidity(filter).then(function(data){
            if(data.errorCode == 1)
              vm.codeExpire = true;
            vm.refUser = data;
            console.log("user Created", data);
          });
      }

      function downloadApp(){
        $window.location.href = "https://play.google.com/store/apps/details?id=com.ionicframework.iquippo474922&hl=en";
      }
      function openRegisterModal(){
        var prevScope = $rootScope.$new();
        var prvSellerModal = $uibModal.open({
            templateUrl: "register.html",
            scope: prevScope,
            size: 'lg'
        });
        prevScope.close = function(){
          prvSellerModal.close();
        }
        prevScope.openLogin = function(){
          Auth.doNotRedirect = false;
          Auth.postLoginCallback = null;
          Modal.openDialog('login');
        }
        prevScope.loginOauth = function(provider) {
          $window.location.href = '/auth/' + provider;
        };

        prevScope.openRegister = function(){
          prevScope.close();
          $scope.openDialog('signup');
        };
      }     
      init();
    }
})();
