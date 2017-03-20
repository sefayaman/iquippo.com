(function() {
  'use strict';

  angular.module('account').controller('ForgotPasswordCtrl', ForgotPasswordCtrl);

  //Controller function
  function ForgotPasswordCtrl($scope, Auth, $rootScope, $uibModal, $uibModalInstance, commonSvc, Modal, notificationSvc) {

    var vm = this;
    vm.data = {};
    vm.sendOTP = sendOTP;
    vm.closeDialog = closeDialog;
    vm.validateOtp = validateOtp;
    vm.changePassword = changePassword;


    $scope.isApproved = false;
    $scope.errors = {};

    function sendOTP() {

      if (!vm.data.mobile && !vm.data.email) {
        Modal.alert('Please enter registered email address or mobile number', true);
        return;
      }
      var data = {};
      data['sendToClient'] = 'n';
      if (vm.data.email) {
        data['email'] = vm.data.email;
        data['otpOn'] = "email";
      } else {
        data['mobile'] = vm.data.mobile;
        data['otpOn'] = "mobile";
      }
      Auth.validateUser(data).
      success(function(res) {
        if (res && res.errorCode == 0) {
          $scope.user = res.user;
          $rootScope.allCountries.some(function(x) {
            if (x.name == $scope.user.country) {
              data['countryCode']=x.countryCode;
              return true;
            }
          })
          data['userId'] = res.user._id;
          data['content'] = 'Your verification OTP is';
          commonSvc.sendOtp(data)
            .then(function() {
              Modal.alert('OTP has been sent successfully!', true);
            })
            .catch(function(res) {
              Modal.alert("Error occured in sending OTP.Please try again.", true);
            })

        } else {
          Modal.alert("We are unable to find your account.Please provide your register email", true);
        }
      }).
      error(function(res) {
        console.log(res);
      });
    }

    function validateOtp() {
      var data = {};
      data['otp'] = vm.data.otp;
      Auth.validateOtp(data).
      success(function(res) {
        $scope.isApproved = true;
      }).
      error(function(res) {

      })
    }


    function changePassword(form1) {

      if (!vm.data.password || vm.data.password !== vm.data.confirmPassword) {
        Modal.alert("Password and confirm password should be same");
        return;
      }
      if (form1.$invalid) {
        $scope.submitted = true;
        return;
      }

      Auth.resetPassword($scope.user._id, vm.data.password)
        .success(function(res) {
          $scope.message = 'Password successfully changed.';
          var data = {};
          data['to'] = Auth.getCurrentUser().email;
          data['subject'] = 'Password Changed: Success';
          var dataToSend = {};
          dataToSend['fname'] = Auth.getCurrentUser().fname;
          dataToSend['lname'] = Auth.getCurrentUser().lname;
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('userPasswordChangedEmail', data, dataToSend, 'email');
          data['to'] = Auth.getCurrentUser().mobile;
          $rootScope.allCountries.some(function(x) {
            if (x.name == $scope.user.country) {
              data['countryCode']=x.countryCode;
              return true;
            }
          })
          notificationSvc.sendNotification('passwordChangesSmsToUser', data, dataToSend, 'sms');
          closeDialog();
        })
        .error(function(res) {
          form1.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
          $scope.message = '';
        });
    }

    function closeDialog() {
      $uibModalInstance.dismiss('cancel');
    };
  }

})();