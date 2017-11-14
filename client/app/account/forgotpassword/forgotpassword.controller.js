(function() {
  'use strict';

  angular.module('account').controller('ForgotPasswordCtrl', ForgotPasswordCtrl);

  //Controller function
  function ForgotPasswordCtrl($scope,$state,Auth,LocationSvc, $rootScope,commonSvc, Modal, notificationSvc) {

    var vm = this;
    vm.data = {};
    vm.sendOTP = sendOTP;
    vm.validateUser = validateUser;
    //vm.closeDialog = closeDialog;
    vm.validateOtp = validateOtp;
    vm.changePassword = changePassword;

    $scope.isUserFound = false;
    $scope.step = 1;
    $scope.errors = {};

    function validateUser(form){

      if(form.$invalid){
        $scope.submitted = true;
        return;
      }

      if (!vm.data.mobile && !vm.data.email) {
        Modal.alert('Please enter registered email address or mobile number', true);
        return;
      }
      var data = {};
      if (vm.data.email) 
          data['email'] = vm.data.email;
      if(vm.data.mobile)
        data['mobile'] = vm.data.mobile;
      $rootScope.loading = true;
      Auth.validateUser(data)
      .then(function(res) {
        $rootScope.loading = false;
        if (res && res.data.errorCode == 0) {
          $scope.user = res.data.user;
          $scope.isUserFound = true;
          sendOTP();

        } else {
          Modal.alert("We are unable to find your account.Please provide your register email", true);
        }
      })
      .catch(function(res) {
        $rootScope.loading = false;
        $scope.isUserFound = false;
        console.log(res.data);
      });


    }

    function sendOTP() {

      if (!vm.data.mobile && !vm.data.email) {
        Modal.alert('Please enter registered email address or mobile number', true);
        return;
      }

      var data = {};
      data['sendToClient'] = 'n';
      if (vm.data.email) 
          data['email'] = vm.data.email;
      if(vm.data.mobile)
        data['mobile'] = vm.data.mobile;
        data['countryCode']= LocationSvc.getCountryCode($scope.user.country);
        data['userId'] = $scope.user._id;
        data['content'] = 'Your verification OTP is';
        $rootScope.loading = true;
        commonSvc.sendOtp(data)
          .then(function() {
            $rootScope.loading = false;
            Modal.alert('OTP has been sent successfully!', true);
          })
          .catch(function(res) {
            $rootScope.loading = true;
            Modal.alert("Error occured in sending OTP.Please try again.", true);
          });
    }

    function validateOtp() {
      var data = {};
      data['otp'] = vm.data.otp;
      data['userId'] = $scope.user._id;
      Auth.validateOtp(data)
      .then(function(res) {
        $scope.step = 2;
      })
      .catch(function(res) {
        if(res.data)
          Modal.alert(res.data);
        $scope.step = 1;
      })
    }


    function changePassword(form) {

       if(form.$invalid) {
          $scope.submitted = true;
          return;
      }

      if (!vm.data.password || !vm.data.passwordConfirm) {
        Modal.alert("Password and confirm password should be same");
        return;
      }

      Auth.resetPassword($scope.user._id, vm.data.password)
        .then(function(res) {
          var data = {};
          data['to'] = $scope.user.email;
          data['subject'] = 'Password Changed: Success';
          var dataToSend = {};
          dataToSend['fname'] = $scope.user.fname;
          dataToSend['lname'] = $scope.user.lname;
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('userPasswordChangedEmail', data, dataToSend, 'email');
          data['to'] = $scope.user.mobile;
          data['countryCode']=LocationSvc.getCountryCode($scope.user.country);
          notificationSvc.sendNotification('passwordChangesSmsToUser', data, dataToSend, 'sms');
          Modal.alert('Password successfully changed.');
          $state.go("main");
        })
        .catch(function(res) {
          if(res.data)
            Modal.alert(res.data);
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
    }

    Auth.isLoggedInAsync(function(isLooogedIn){
      if(isLooogedIn)
        $state.go('main');
    });

  }

})();