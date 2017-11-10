(function() {
  'use strict';

  angular.module('sreizaoApp').controller('userRegForAuctionCtrl', userRegForAuctionCtrl);

  function userRegForAuctionCtrl($scope, $http, $rootScope, userRegForAuctionSvc,$state,LocationSvc, Modal, Auth, AuctionSvc, UtilSvc, $uibModal, $uibModalInstance, notificationSvc, MarketingSvc, EmdSvc, LotSvc) {
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
          if($scope.currentAuction.emdTax === 'lotWise') {
            dataObj.selectedLots =  vm.dataToSend.selectedLots;
          }
          else {
            dataObj.selectedLots = [];
            vm.lotList.forEach(function(item){
              dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
            });
          }
          userRegForAuctionSvc.checkUserRegis(dataObj)
          .then(function(result){
            console.log("the registration",result);
            closeDialog();
            if(result.data){
              if(result.data =="done"){
                 Modal.alert("You have already registered for this auction with lotnumbers" +" "+ result.selectedLots); 
                 return;
               }
              if(result.data =="undone"){
                Modal.alert("Your EMD payment is still pending. Please pay the EMD amount and inform our customer care team.",true);
                return;
              }
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
        console.log("user", vm.userId);
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
        //openActionDialog(auctionData, userData);
        validateRegisterUser(auctionData, userData);
      } else {
        var dataToSend = {};
        dataToSend['userId'] = vm.userId;;
        dataToSend['password'] = vm.passwordlogin;
        
        Auth.login(dataToSend)
          .then(function() {
            validateRegisterUser(auctionData, userData);
            //openActionDialog(auctionData, userData);
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
      vm.UserObj.password = "123456";
      if(Auth.isAdmin()) {
        vm.UserObj.createdBy = {};
        vm.UserObj.createdBy._id = Auth.getCurrentUser()._id;
        vm.UserObj.createdBy.fname = Auth.getCurrentUser().fname;
        vm.UserObj.createdBy.lname = Auth.getCurrentUser().lname;
        vm.UserObj.createdBy.role = Auth.getCurrentUser().role;
        vm.UserObj.createdBy.mobile = Auth.getCurrentUser().mobile;
        vm.UserObj.createdBy.email = Auth.getCurrentUser().email;
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
            saveNewUser(auctionData, vm.UserObj);
          }
        });
      } else {
        Auth.createUser(vm.UserObj)
          .then(function(result) {
            sendMailToUser(auctionData, result);
          })
          .catch(function(err) {
            err = err.data;
            $scope.errors = {};
            $scope.isRegister = true;
            vm.otpCode = "";
            // Update validity of form fields that match the mongoose errors
            angular.forEach(err.errors, function(error, field) {
              Modal.alert(error.message, true);
            });
          });
        }
    }

    function saveNewUser(auctionData,userData){
      $http.post('/api/users/register',userData).success(function(result) {
      if(result && result.errorCode == 1){
        Modal.alert(result.message, true);
      } else {
        console.log("result admin user###", result);
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
      dataToSend['password'] = "123456";
      dataToSend['serverPath'] = serverPath;
      notificationSvc.sendNotification('manpowerRegSmsToUser', data, dataToSend, 'sms');
      if (vm.user.email) {
        data['to'] = vm.user.email;
        notificationSvc.sendNotification('userRegEmail', data, dataToSend, 'email');
      }
      closeDialog();
      var auctionRegislogin = $rootScope.$new();
      auctionRegislogin.currentAuction = auctionData;
      if(Auth.isAdmin())
        auctionRegislogin.registerUser = userData;
      Modal.openDialog('auctionRegislogin',auctionRegislogin);
    }

    function closeDialog() {
      $uibModalInstance.dismiss('cancel');
    }
  }
})();