(function() {
  'use strict';

  angular.module('sreizaoApp').controller('userRegForAuctionCtrl', userRegForAuctionCtrl);

  function userRegForAuctionCtrl($scope, $http, $rootScope, userRegForAuctionSvc,$state,LocationSvc, Modal, Auth, AuctionSvc, UtilSvc, $uibModal, $uibModalInstance, notificationSvc, LotSvc, commonSvc) {
    var vm = this;
    vm.closeDialog = closeDialog;
    vm.submit = submit;
    vm.onCodeChange = onCodeChange;
    $scope.option = {};
    vm.dataModel = {};
    vm.user = {};
    vm.lotList = [];
    vm.otpCode = "";
    $scope.isRegister = true;
    vm.user.countryCode = "91";
    vm.onLocationChange = onLocationChange;
    $scope.getCountryWiseState = getCountryWiseState;
    $scope.getStateWiseLocation = getStateWiseLocation;
    vm.Verify = Verify;
    vm.sendOTP = sendOTP;
    $scope.OverAll = "overall";
    $scope.LotWist = "lotwise";

    function init() {
      LotSvc.getData({auction_id: $scope.currentAuction._id}).then(function(res) {
        vm.lotList = res;
      });
      onCodeChange(vm.user.countryCode);
    }

    init();

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

      $scope.code = LocationSvc.getCountryCode(country);
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

    function onCodeChange(code) {
      $scope.country = LocationSvc.getCountryNameByCode(code);
    }
    $scope.lotsArr = [];
    function validateRegisterUser(auctionData, userData) {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {  
          var dataObj = {};
          dataObj.auction = {};
          dataObj.user = {};
          dataObj.auction.dbAuctionId = $scope.currentAuction._id;
          if(!Auth.isAdmin()) {
            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.mobile = Auth.getCurrentUser().mobile;
          } else {
            dataObj.user._id = userData._id;
            dataObj.user.mobile = userData.mobile;
          }
          if($scope.currentAuction.emdTax === $scope.OverAll) {
            dataObj.selectedLots = [];
            vm.lotList.forEach(function(item){
              dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
            });
          } else {
            dataObj.emdTax = $scope.LotWist;
          }
          userRegForAuctionSvc.checkUserRegis(dataObj)
          .then(function(result){
            closeDialog();
            if(result.data){
              if(result.data =="done" && auctionData.emdTax === $scope.OverAll){
                 Modal.alert("You have already registered for this auction with lotnumbers" +" "+ result.selectedLots); 
                 return;
               }
              if(result.data =="undone" && auctionData.emdTax === $scope.OverAll){
                Modal.alert("Your EMD payment is still pending. Please pay the EMD amount and inform our customer care team.",true);
                return;
              }
            }
            if(result && result.length > 0 && auctionData.emdTax === $scope.LotWist)
            { $scope.lotsArr = [];
                result.forEach(function(item){
                  for (var i=0; i < item.selectedLots.length;i++)
                    $scope.lotsArr.push(item.selectedLots[i]);
                });
            }
            openActionDialog(auctionData, userData);
          }); 
        }
      });
    }
    
    function submit(form) {
      var ret = false;
      if ($scope.country && vm.user.mobile) {
        var value = UtilSvc.validateMobile($scope.country, vm.user.mobile);
        if (!value) {
          form.mobile.$invalid = true;
          ret = true;
        } else {
          form.mobile.$invalid = false;
          ret = false;
        }
      }
      if (form.$invalid || ret) {
        form.submitted = true;
        return;
      }
      if ($scope.option.select === 'yes') {
        var data = {};
        if (vm.userId)
          data.userId = vm.userId;
        data.forAuction = true;
        Auth.validateUser(data).
        success(function(res) {
          if (res && res.errorCode === 0)
            login($scope.currentAuction, res.user);
          else
            Modal.alert("We are unable to find your account. Please provide correct Mobile / Email Id", true);
        }).
        error(function(res) {
          console.log(res);
        });
      } else {
          createUser($scope.currentAuction, vm.user);
      }
    }

    function login(auctionData, userData) {
      if(Auth.isAdmin()) {
        userData.batonNo = vm.user.batonNo;
        validateRegisterUser(auctionData, userData);
      } else {
        var dataToSend = {};
        dataToSend['userId'] = vm.userId;;
        dataToSend['password'] = vm.passwordlogin;
        
        Auth.login(dataToSend)
          .then(function() {
            validateRegisterUser(auctionData, userData);
          })
          .catch(function(err) {
            if(err && err.message)
              Modal.alert(err.message, true);
          });
        }
    };

    function openActionDialog(auctionData, userData){
      closeDialog();
      var auctionRegislogin = $rootScope.$new();
      auctionRegislogin.currentAuction = auctionData;
      auctionRegislogin.registrationPage = true;
      if($scope.lotsArr.length > 0 && auctionData.emdTax === $scope.LotWist)
        auctionRegislogin.regLots = $scope.lotsArr;
      if(Auth.isAdmin())
        auctionRegislogin.registerUser = userData;
      Modal.openDialog('auctionRegislogin',auctionRegislogin);   
    }

    function createUser(auctionData, userData) {
      vm.UserObj = {};
      vm.UserObj.fname = userData.fname;
      vm.UserObj.lname = userData.lname;
      vm.UserObj.countryCode = userData.countryCode ? userData.countryCode : LocationSvc.getCountryCode(userData.country);
      vm.UserObj.mobile = userData.mobile;
      vm.UserObj.email = userData.email;
      vm.UserObj.country = userData.country;
      vm.UserObj.state = userData.state;
      vm.UserObj.city = userData.city;
      vm.UserObj.panNumber = userData.panNumber;
      vm.UserObj.password = userData.password;
      if(Auth.isAdmin()) {
        vm.UserObj.createdBy = {};
        vm.UserObj.createdBy._id = Auth.getCurrentUser()._id;
        vm.UserObj.createdBy.fname = Auth.getCurrentUser().fname;
        vm.UserObj.createdBy.lname = Auth.getCurrentUser().lname;
        vm.UserObj.createdBy.role = Auth.getCurrentUser().role;
        vm.UserObj.createdBy.mobile = Auth.getCurrentUser().mobile;
        vm.UserObj.createdBy.email = Auth.getCurrentUser().email;
        vm.UserObj.createdBy.customerId = Auth.getCurrentUser().customerId;
        
        vm.UserObj.password = "1234";
        vm.UserObj.batonNo = userData.batonNo;
      }
      var dataToSend = {};
      if(vm.UserObj.email) 
        dataToSend.email = vm.UserObj.email;
      if(vm.UserObj.mobile) 
        dataToSend.mobile = vm.UserObj.mobile;
      Auth.validateSignup(dataToSend).then(function(data){
        if(data.errorCode == 1){
           Modal.alert("The specified mobile is already in use.",true);
           return;
        } else if(data.errorCode == 2){
          Modal.alert("The specified email is already in use.",true);
           return;
        } else {
          if(Auth.isAdmin())
            saveNewUser(auctionData, vm.UserObj);
          else
            sendOTP();
          
        }
      });
    }

    function sendOTP() {
      var dataToSend = {};
      dataToSend['content'] = 'Dear User, One TimePassword (OTP) to verify your iQuippo account is ';
      dataToSend['otpOn'] = "mobile";
      dataToSend['sendToClient'] = 'y';
      if (vm.user.mobile)
          dataToSend['mobile'] = vm.user.mobile;
      if ($scope.code)
          dataToSend['countryCode'] = vm.user.countryCode;
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

    function Verify() {
      if (!angular.isUndefined(vm.otpCode) && !angular.isUndefined(vm.user.otp) && vm.otpCode === vm.user.otp) {
        vm.UserObj.mobileVerified = true;
        
        Auth.createUser(vm.UserObj)
          .then(function(result) {
            Auth.isLoggedInAsync(function(loggedIn){
              if(loggedIn)
                sendMailToUser($scope.currentAuction, Auth.getCurrentUser());
            });
          })
          .catch(function(err) {
            err = err.data;
            $scope.errors = {};
            $scope.isRegister = true;
            vm.otpCode = "";
            // Update validity of form fields that match the mongoose errors
            angular.forEach(err.errors, function(error, field) {
              //form[field].$setValidity('mongoose', false);
              Modal.alert(error.message, true);
            });
          });
      } else {
        Modal.alert("Incorrect OTP please enter correct OTP", true);
      }
    }

    function saveNewUser(auctionData,userData){
      $http.post('/api/users/register',userData).success(function(result) {
      if(result && result.errorCode == 1){
        Modal.alert(result.message, true);
      } else {
        userData.customerId = result.customerId;
        userData._id = result._id;
        sendMailToUser(auctionData, userData);
        } 
      }).error(function(res){
          Modal.alert(res,true);
      });
  }

    function sendMailToUser(auctionData, userData) {
      var data = {};
      if (vm.user.mobile)
        data['to'] = vm.user.mobile;
      data['countryCode'] = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
      data['subject'] = 'New User Registration: Success';
      var dataToSend = {};
      dataToSend['fname'] = vm.user.fname;
      dataToSend['lname'] = vm.user.lname;
      dataToSend['mobile'] = vm.user.mobile;
      dataToSend['email'] = vm.user.email;
      dataToSend['serverPath'] = serverPath;
      dataToSend['password'] = vm.user.password;
      dataToSend['userId'] = userData.customerId;
      dataToSend['customerId'] = userData.customerId;
      if(Auth.isAdmin())
        dataToSend['password'] = "1234";
      dataToSend['existFlag'] = false;
      
      notificationSvc.sendNotification('partnerRegSmsToUser', data, dataToSend,'sms');
      if (vm.user.email) {
        data['to'] = vm.user.email;
        notificationSvc.sendNotification('userRegEmail', data, dataToSend, 'email');
      }
      closeDialog();
      var auctionRegislogin = $rootScope.$new();
      auctionRegislogin.currentAuction = auctionData;
      if($scope.lotsArr.length > 0 && auctionData.emdTax === $scope.LotWist)
        auctionRegislogin.regLots = $scope.lotsArr;
      if(Auth.isAdmin())
        auctionRegislogin.registerUser = userData;
      Modal.openDialog('auctionRegislogin',auctionRegislogin);
    }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}
})();