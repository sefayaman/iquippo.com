(function() {

  'use strict';
  angular.module('account').controller('SignupCtrl', SignupCtrl);

  //controller function
  function SignupCtrl($scope, commonSvc, $rootScope, Auth, $location, UtilSvc, $window, $uibModalInstance, InvitationSvc, Modal, LocationSvc, notificationSvc, MarketingSvc) {
    var vm = this;
    var facebookConversionSent = false;
    vm.user = {};
    vm.otpCode;
    vm.user.activationOTP = "mobile";
    vm.register = register;
    vm.verify = verify;
    vm.openLogin = openLogin;
    vm.closeDialog = closeDialog;
    vm.loginOauth = loginOauth;
    vm.sendOTP = sendOTP;
    $scope.isDisabled = false;

    //$scope.phoneErrorMessage = "";
    $scope.errors = {};
    $scope.isRegister = true;
    vm.onLocationChange = onLocationChange;

    $scope.getCountryWiseState = getCountryWiseState;
    $scope.getStateWiseLocation = getStateWiseLocation;

    function getCountryWiseState(country) {
      $scope.isDisabled = false;
      vm.user.state = "";
      vm.user.city = "";
      var filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
        $scope.locationList = "";
      });
      $scope.code=LocationSvc.getCountryCode(country);
      if (country == "Other") {
        vm.user.activationOTP = "email";
        $scope.isDisabled = true;
        $scope.code = "";
      }
    }

    function getStateWiseLocation(state) {
      vm.user.city = "";
      var filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }



    function onLocationChange(city) {
      vm.user.state = LocationSvc.getStateByCity(city);
    }

    function init() {
      LocationSvc.getAllLocation()
        .then(function(result) {
          //$scope.locationList = result;
        })
    }
    init();

    function register() {
      var ret = false;
      if(vm.user.country && vm.user.mobile) { 
        var value = UtilSvc.validateMobile(vm.user.country, vm.user.mobile);
        if(!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }

      if ($scope.form.$invalid || ret) {
        $scope.submitted = true;
        return;
      }


      if (vm.user.agree) {
        var dataToSend = {};
        if (vm.user.email)
          dataToSend['email'] = vm.user.email;
        if (vm.user.mobile)
          dataToSend['mobile'] = vm.user.mobile;
        Auth.validateSignup(dataToSend).then(function(data) {
          if (data.errorCode == 1) {
            Modal.alert("Mobile number already in use. Please use another mobile number", true);
            return;
          } else if (data.errorCode == 2) {
            Modal.alert("Email address already in use. Please use another email address", true);
            return;
          } else {
            sendOTP();
          }
        });
      } else {
        Modal.alert("Please Agree to the Terms & Conditions", true);
      }
    };

    function verify(form) {

      if (!angular.isUndefined(vm.otpCode) && !angular.isUndefined(vm.user.otp) && vm.otpCode == vm.user.otp) {
        if (vm.user.activationOTP == 'email')
          vm.user.emailVerified = true;
        if (vm.user.activationOTP == 'mobile')
          vm.user.mobileVerified = true;
        
        if (vm.user.country == "Other") {
          vm.user.isOtherCountry = true;
          vm.user.country = vm.user.otherCountry;
        }
        if (vm.user.state == "Other") {
          vm.user.isOtherState = true;
          vm.user.state = vm.user.otherState;
        }
        if (vm.user.city == "Other") {
          vm.user.isOtherCity = true;
          vm.user.city = vm.user.otherCity;
        }
        Auth.createUser(vm.user)
          .then(function(result) {
            if ($location.search().ref_id && $location.search().code) {
              Auth.isLoggedInAsync(function(success) {
                if (success) {
                  var couponData = {};
                  couponData.user = {};
                  couponData.refBy = {};
                  couponData.user = Auth.getCurrentUser();
                  couponData.refBy.refId = $location.search().ref_id;
                  couponData.refBy.code = $location.search().code;
                  //Google and Facbook conversion start
                  MarketingSvc.googleConversion();
                  if (!facebookConversionSent) {
                    MarketingSvc.facebookConversion();
                    facebookConversionSent = true;
                  }
                  //Google and Facbook conversion end

                  InvitationSvc.createCoupon(couponData)
                    .then(function(res) {
                      console.log("Coupon Created");
                    });
                }
              });
            }
            var data = {};
            if (vm.user.mobile)
              data['to'] = vm.user.mobile;
            data['countryCode']=LocationSvc.getCountryCode(Auth.getCurrentUser().country);
            data['subject'] = 'New User Registration: Success';
            var dataToSend = {};
            dataToSend['fname'] = vm.user.fname;
            dataToSend['lname'] = vm.user.lname;
            dataToSend['mobile'] = vm.user.mobile;
            dataToSend['email'] = vm.user.email;
            dataToSend['password'] = vm.user.password;
            dataToSend['serverPath'] = serverPath;
            notificationSvc.sendNotification('manpowerRegSmsToUser', data, dataToSend, 'sms');
            if (vm.user.email) {
              data['to'] = vm.user.email;
              notificationSvc.sendNotification('userRegEmail', data, dataToSend, 'email');
            }
            /*var data = {};
            data['to'] = vm.user.email;
            data['subject'] = 'New User Registration: Success';
            vm.user.serverPath = serverPath;
            notificationSvc.sendNotification('userRegEmail', data, vm.user,'email');*/
            closeDialog();
            vm.user = {};
          })
          .catch(function(err) {
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
      } else {
        Modal.alert("Incorrect OTP please enter correct OTP", true);
      }

    }

    function sendOTP() {

      var dataToSend = {};
      dataToSend['content'] = 'Dear User, One TimePassword (OTP) to verify your iQuippo account is ';
      dataToSend['otpOn'] = vm.user.activationOTP;
      dataToSend['sendToClient'] = 'y';
      if (vm.user.activationOTP == 'email') {
        if (vm.user.email) {
          dataToSend['email'] = vm.user.email;
        } else {
          Modal.alert('Please enter the email address', true);
          return;
        }
      } else if (vm.user.activationOTP == 'mobile') {
        if ($scope.code)
          dataToSend['countryCode'] = $scope.code;

        if (vm.user.mobile) {
          dataToSend['mobile'] = vm.user.mobile;
        } else {
          Modal.alert('Please enter the mobile number', true);
          return;
        }
      } else {
        Modal.alert('Please select otp option', true);
        return;
      }
      $scope.isRegister = false;
      commonSvc.sendOtp(dataToSend)
        .then(function(result) {
          vm.otpCode = result;
          Modal.alert('OTP has been sent successfully', true);
        })
        .catch(function(res) {
          Modal.alert("Error occured in sending OTP.Please try again.", true);
          $scope.isRegister = true;
        });

    }

    function loginOauth(provider) {
      $window.location.href = '/auth/' + provider;
    };

    function openLogin() {
      closeDialog();
      $scope.openDialog('login');
    };


    function closeDialog() {
      $uibModalInstance.dismiss('cancel');
    };

  }


})()