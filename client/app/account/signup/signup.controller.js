(function(){

'use strict';
angular.module('account').controller('SignupCtrl',SignupCtrl);

//controller function
function SignupCtrl($scope, commonSvc, $rootScope, Auth, $location, $window,$uibModalInstance,InvitationSvc,Modal,LocationSvc, notificationSvc) {
    var vm = this;

    vm.user = {};
    vm.otpCode;
    vm.user.activationOTP = "mobile";
    vm.register = register;
    vm.verify = verify;
    vm.openLogin = openLogin;
    vm.closeDialog = closeDialog;
    vm.loginOauth = loginOauth;
    vm.sendOTP = sendOTP;
    //$scope.phoneErrorMessage = "";
    $scope.errors = {};
    $scope.isRegister = true;

    function init(){
      LocationSvc.getAllLocation()
      .then(function(result){
        $scope.locationList = result;
      })
    }
    init();
  function register() {
      //$scope.form.mobile.$invalid = false;

      if($scope.form.$invalid){
        $scope.submitted = true;
        return;
      }

      if(vm.user.agree) 
      {
        var dataToSend = {};
        if(vm.user.email) 
          dataToSend['email'] = vm.user.email;
        if(vm.user.mobile) 
          dataToSend['mobile'] = vm.user.mobile;
        Auth.validateSignup(dataToSend).then(function(data){
          if(data.errorCode == 1){
            Modal.alert("Mobile number already in use. Please use another mobile number",true);
              return;
          } else if(data.errorCode == 2){
            Modal.alert("Email address already in use. Please use another email address",true);
              return;
          } else {
              sendOTP();
          }
        });
      }else{
         Modal.alert("Please Agree to the Terms & Conditions",true);
      }

      if(vm.user.country == 'Other')
          vm.user.country = vm.user.otherCountry;
    };

  function verify(form){

  if(!angular.isUndefined(vm.otpCode) && !angular.isUndefined(vm.user.otp) && vm.otpCode == vm.user.otp) 
    {   if(vm.user.activationOTP == 'email')
            vm.user.emailVerified = true;
        if(vm.user.activationOTP == 'mobile')
            vm.user.mobileVerified = true;
        Auth.createUser(vm.user)
        .then( function(result) {
          if($location.search().ref_id && $location.search().code) {
            Auth.isLoggedInAsync(function(success) {
              if(success){
                var couponData = {};
                couponData.user = {};
                couponData.refBy = {};
                couponData.user = Auth.getCurrentUser();
                couponData.refBy.refId = $location.search().ref_id;
                couponData.refBy.code = $location.search().code;
                InvitationSvc.createCoupon(couponData)
                .then(function(res){
                  console.log("Coupon Created");
                });
              }
            });
          }
          var data = {};
          if(vm.user.mobile)
            data['to'] = vm.user.mobile;
          data['subject'] = 'New User Registration: Success';
          var dataToSend = {};
          dataToSend['fname'] = vm.user.fname; 
          dataToSend['lname'] = vm.user.lname;
          dataToSend['mobile'] = vm.user.mobile;
          dataToSend['email'] = vm.user.email;
          dataToSend['password'] = vm.user.password;
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('manpowerRegSmsToUser', data, dataToSend,'sms');
          if(vm.user.email) {
            data['to'] = vm.user.email;
            notificationSvc.sendNotification('userRegEmail', data, dataToSend,'email');
          }
          /*var data = {};
          data['to'] = vm.user.email;
          data['subject'] = 'New User Registration: Success';
          vm.user.serverPath = serverPath;
          notificationSvc.sendNotification('userRegEmail', data, vm.user,'email');*/
          closeDialog();
          vm.user = {};
        })
        .catch( function(err) {
          err = err.data;
          $scope.errors = {};
          $scope.isRegister = true;
          vm.otpCode = "";
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

function sendOTP(){

  var dataToSend = {};
  dataToSend['content'] = 'Dear User, One TimePassword (OTP) to verify your iQuippo account is ';
  dataToSend['otpOn'] = vm.user.activationOTP;
  dataToSend['sendToClient'] = 'y';
  if(vm.user.activationOTP == 'email') {
   if(vm.user.email) {
       dataToSend['email'] = vm.user.email;
    }else {
      Modal.alert('Please enter the email address',true);
      return;
    }
  }else if(vm.user.activationOTP == 'mobile') {
    if(vm.user.mobile) {
       dataToSend['mobile'] = vm.user.mobile;
    }else {
      Modal.alert('Please enter the mobile number',true);
      return;
    }
  }else{
      Modal.alert('Please select otp option',true);
      return;
    }
  $scope.isRegister = false;
  commonSvc.sendOtp(dataToSend)
  .then(function(result){
     vm.otpCode = result;
      Modal.alert('OTP has been sent successfully',true);
  })
  .catch(function(res){
    Modal.alert("Error occured in sending OTP.Please try again.",true);
    $scope.isRegister = true;
  });

}

  function loginOauth(provider) {
      $window.location.href = '/auth/' + provider;
    };

    function openLogin(){
          closeDialog();
         $scope.openDialog('login');
    };


    function closeDialog() {
      $uibModalInstance.dismiss('cancel');
    };
    
  }


})()
