(function() {
  'use strict';

  angular.module('sreizaoApp').controller('userRegForAuctionCtrl', userRegForAuctionCtrl);

  function userRegForAuctionCtrl($scope, $rootScope, userRegForAuctionSvc,$state,LocationSvc, Modal, Auth, AuctionSvc, UtilSvc, $uibModal, $uibModalInstance, notificationSvc, MarketingSvc, EmdSvc, LotSvc) {
    var vm = this;
    vm.closeDialog = closeDialog;
    vm.submit = submit;
    vm.onCodeChange = onCodeChange;
    $scope.option = {};
    vm.dataModel = {};
    vm.user = {};
    vm.lotList = [];
    vm.user.countryCode = "91";
    vm.onLocationChange = onLocationChange;
    $scope.getCountryWiseState = getCountryWiseState;
    $scope.getStateWiseLocation = getStateWiseLocation;
    // var query=$scope.params;
    // $scope.emdTax=query.emdTax;
    
    function init() {
      LotSvc.getData({auction_id: $scope.currentAuction._id}).then(function(res) {
        vm.lotList = res;
      });
      onCodeChange(vm.user.countryCode);
    }

    init();

    function getCountryWiseState(country) {
      //console.log("sqsqq",country);
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
        console.log("user", vm.userId);
        userRegForAuctionSvc.validateUser(data).
        success(function(res) {
          if (res && res.errorCode === 0) {
            login($scope.currentAuction, res.user);
          } else {
            Modal.alert("We are unable to find your account. Please provide correct Mobile / Email Id", true);
          }
        }).
        error(function(res) {
          console.log(res);
        });
      } else {
        createUser($scope.currentAuction, vm.user);
      }
    }

    function login(auctionData, userData) {
      var dataToSend = {};
      dataToSend['userId'] = vm.userId;;
      dataToSend['password'] = vm.passwordlogin;
      //console.log("lots", vm.selectedLots.lotNumber);
      Auth.login(dataToSend)
        .then(function() {
          //$rootScope.loading = true;
          console.log("CurrentAuction", $scope.currentAuction);
          closeDialog();
          var auctionRegislogin = $rootScope.$new();
          auctionRegislogin.currentAuction = auctionData;
          auctionRegislogin.registrationPage = true;
          Modal.openDialog('auctionRegislogin',auctionRegislogin);
          //createReqData($scope.currentAuction, userData, vm.selectedLots.lotNumber);
        })
        .catch(function(err) {
          $scope.errors.other = err.message;
        });

    };



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
      vm.UserObj.password = "Auction_" + userData.mobile;

      Auth.createUser(vm.UserObj)
        .then(function(result) {
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
          dataToSend['password'] = "Auction_" + vm.user.mobile;
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('manpowerRegSmsToUser', data, dataToSend, 'sms');
          if (vm.user.email) {
            data['to'] = vm.user.email;
            notificationSvc.sendNotification('userRegEmail', data, dataToSend, 'email');
          }
          closeDialog();
          var auctionRegislogin = $rootScope.$new();
          auctionRegislogin.currentAuction = auctionData;
          Modal.openDialog('auctionRegislogin',auctionRegislogin);
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

    }

    function closeDialog() {
      $uibModalInstance.dismiss('cancel');
    }
  }

})();