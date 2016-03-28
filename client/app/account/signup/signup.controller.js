'use strict';

angular.module('sreizaoApp')
  .controller('SignupCtrl', function ($scope, $http, $rootScope, Auth, $location, $window,$uibModalInstance,Modal, notificationSvc) {
    $scope.user = {};
    $scope.errors = {};
    $scope.otpCode;
    $scope.isRegister = true;
    $scope.user.activationOTP = "email";
    //$scope.phoneErrorMessage = "";
    $scope.register = function() {
      var ret = false;
      //$scope.form.mobile.$invalid = false;

      if($scope.form.$invalid ||ret){
        $scope.submitted = true;
        return;
      }
      if($scope.user.agree) 
      {
        Auth.validateSignup({email:$scope.user.email,mobile:$scope.user.mobile}).then(function(data){
          if(data.errorCode == 1){
             Modal.alert("Email address already in use. Please use another email address",true);
             return;
          }else if(data.errorCode == 2){
            Modal.alert("Mobile number already in use. Please use another mobile number",true);
             return;
          }else{
               $scope.sendOTP();
          }
        });
      }else{
         Modal.alert("Please Agree to the Terms & Conditions",true);
      }
      if($scope.user.country == 'Other')
          $scope.user.country = $scope.user.otherCountry;
    };


$scope.verify = function(form){
  if(!angular.isUndefined($scope.otpCode) 
    && !angular.isUndefined($scope.user.otp) 
    && $scope.otpCode == $scope.user.otp) 
    {
        Auth.createUser($scope.user)
        .then( function(result) {
          var data = {};
          data['to'] = $scope.user.email;
          data['subject'] = 'New User Registration: Success';
          $scope.user.serverPath = serverPath;
          notificationSvc.sendNotification('userRegEmail', data, $scope.user,'email');
          $scope.closeDialog();
          $scope.user = {};
        })
        .catch( function(err) {
          err = err.data;
          $scope.errors = {};
          $scope.isRegister = true;
          $scope.otpCode = "";
          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });
        });
    } 
    else 
    {
      Modal.alert("Incorrect OTP please enter correct OTP",true);
    }

}

$scope.sendOTP = function(){
  var dataToSend = {};
  dataToSend['content'] = 'Your verification OTP is ';
  dataToSend['otpOn'] = $scope.user.activationOTP;
  dataToSend['sendToClient'] = 'y';
  if($scope.user.activationOTP == 'email') {
   if($scope.user.email) {
       dataToSend['email'] = $scope.user.email;
    }else {
      Modal.alert('Please enter the email address',true);
      return;
    }
  }
  $scope.isRegister = false;
  $http.post('/api/common/sendOtp',dataToSend).success(function(result) {
      $scope.otpCode = result;
      Modal.alert('OTP has been sent successfully',true);
    }).error(function(res){
        Modal.alert(res,true);
        $scope.isRegister = true;
    });

}

  $scope.loginOauth = function(provider) {
      $window.location.href = '/auth/' + provider;
    };

    $scope.openLogin = function(){
          $scope.closeDialog();
         $scope.openDialog('login');
    };


    $scope.closeDialog = function () {
      $uibModalInstance.dismiss('cancel');
    };
    
  });
