(function() {

  'use strict';
  angular.module('account').controller('SignupCtrl', SignupCtrl);

  //controller function
  function SignupCtrl($scope,$state,$stateParams,commonSvc, $rootScope, Auth, $location, UtilSvc, $window, InvitationSvc, Modal, LocationSvc, notificationSvc, MarketingSvc) {
    var vm = this;
    var facebookConversionSent = false;

    $scope.step = 0;

    vm.user = {};
    vm.otpCode;
    vm.register = register;

    vm.submitPersonalInfo = submitPersonalInfo;
    vm.verifyOtp = verifyOtp;

    vm.loginOauth = loginOauth;
    vm.sendOTP = sendOTP;
    vm.validateAadhaar = validateAadhaar;
    $scope.errors = {};
    $scope.isRegister = true;

    $scope.getCountryWiseState = getCountryWiseState;
    $scope.getStateWiseLocation = getStateWiseLocation;


    function submitPersonalInfo(form){
      if(form.$invalid){
        $scope.submitted = true;
        return;
      }
      if(!vm.user.agree){
         Modal.alert("Please Agree to the Terms & Conditions", true);
         return;
      }
      var dataToSend = {};
      if (vm.user.email)
        dataToSend['email'] = vm.user.email;
      if (vm.user.mobile)
        dataToSend['mobile'] = vm.user.mobile;
        Auth.validateSignup(dataToSend).then(function(data){
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
    }

    function verifyOtp(form){
       if(form.$invalid){
        $scope.submitted = true;
        return;
      }
      if (!angular.isUndefined(vm.otpCode) && !angular.isUndefined(vm.user.otp) && vm.otpCode == vm.user.otp){
        $scope.step = 2;
      }else{
        Modal.alert("Incorrect OTP please enter correct OTP.", true);
      }
    }

    function register(form){
       if(form.$invalid){
        $scope.submitted = true;
        return;
      }

       Auth.createUser(vm.user)
          .then(function(result) {
            Auth.isLoggedInAsync(function(success) {
              if (success) {
                  if($location.search().ref_id && $location.search().code)
                    createCoupon();
                    sendRegistartionNotification();
                  if($stateParams.state){
                    var state = $stateParams.state;
                    delete $stateParams.state;
                    $state.go(state,$stateParams);
                  }else
                    $state.go("main");
                  //$state.go('main');
              }else
                console.log("error in auto login");
            });
          })
          .catch(function(err) {
            err = err.data;
            $scope.errors = {};
            vm.otpCode = "";
            // Update validity of form fields that match the mongoose errors
            angular.forEach(err.errors, function(error, field) {
              form[field].$setValidity('mongoose', false);
              $scope.errors[field] = error.message;
            });
          });
    }

    function getCountryWiseState(country) {
      vm.user.state = "";
      vm.user.city = "";
      var filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
        $scope.locationList = "";
      });

      $scope.code = LocationSvc.getCountryCode(country);
    }

    function getStateWiseLocation(state) {
      vm.user.city = "";
      var filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }


    function init() {
        Auth.isLoggedInAsync(function(loggedIn){
          if(loggedIn)
            return $state.go('main');
        });
    }

    function validateAadhaar(aadhaarNumber) {
      if(!aadhaarNumber)
        return;
      vm.user.aadhaarNumber = UtilSvc.validateAadhaar(aadhaarNumber, false);
    }

    
    function createCoupon(){
      var couponData = {};
      couponData.user = {};
      couponData.refBy = {};
      couponData.user = Auth.getCurrentUser();
      couponData.refBy.refId = $location.search().ref_id;
      couponData.refBy.code = $location.search().code;
      InvitationSvc.createCoupon(couponData)
    }

    function sendRegistartionNotification(){
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
       dataToSend['customerId'] = Auth.getCurrentUser().customerId;
      notificationSvc.sendNotification('manpowerRegSmsToUser', data, dataToSend, 'sms');
      if (vm.user.email) {
        data['to'] = vm.user.email;
        notificationSvc.sendNotification('userRegEmail', data, dataToSend, 'email');
      }
    }

    function sendMarketingConversion(){
       //Google and Facbook conversion start
      MarketingSvc.googleConversion();
      if (!facebookConversionSent) {
        MarketingSvc.facebookConversion();
        facebookConversionSent = true;
      }
      //Google and Facbook conversion end
    }

    function sendOTP() {

      var dataToSend = {};
      dataToSend['content'] = 'Dear User, One TimePassword (OTP) to verify your iQuippo account is ';
      //dataToSend['otpOn'] = vm.user.activationOTP;
      dataToSend['sendToClient'] = 'y';
      if(vm.user.email)
        dataToSend['email'] = vm.user.email;
      if(vm.user.mobile){
        if ($scope.code)
          dataToSend.countryCode = $scope.code;
        dataToSend['mobile'] = vm.user.mobile;
      }
      if(!dataToSend.email && !dataToSend.mobile){
        Modal.alert('Please enter the mobile number or email', true);
        return;
      }

      commonSvc.sendOtp(dataToSend)
        .then(function(result) {
          $scope.step = 1;
          vm.otpCode = result;
          Modal.alert('OTP has been sent successfully', true);
        })
        .catch(function(res) {
          Modal.alert("Error occured in sending OTP.Please try again.", true);
          $scope.step = 0;
        });

    }

    function loginOauth(provider) {
      $window.location.href = '/auth/' + provider;
    };

    init();
  }


})()