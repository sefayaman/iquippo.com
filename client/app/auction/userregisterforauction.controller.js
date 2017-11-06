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
          //auctionRegislogin.selectedLots = vm.selectedLots.lotNumber;
          /*if($scope.currentAuction.emdTax === 'lotWise') {
            auctionRegislogin.selectedLots = vm.selectedLots.lotNumber;
          }
          else {
            auctionRegislogin.selectedLots = [];
            vm.lotList.forEach(function(item){
              auctionRegislogin.selectedLots[auctionRegislogin.selectedLots.length] = item.lotNumber;
            });
          }*/
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
          //auctionRegislogin.selectedLots = vm.selectedLots.lotNumber;
          /*if($scope.currentAuction.emdTax === 'lotWise') {
            auctionRegislogin.selectedLots = vm.selectedLots.lotNumber;
          }
          else {
            auctionRegislogin.selectedLots = [];
            vm.lotList.forEach(function(item){
              auctionRegislogin.selectedLots[auctionRegislogin.selectedLots.length] = item.lotNumber;
            });
          }*/
          Modal.openDialog('auctionRegislogin',auctionRegislogin);
          //createReqData($scope.currentAuction, vm.user, vm.selectedLots.lotNumber);
          // vm.user = {};
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

    function createReqData(auctionData,userData,lotData) {
      var dataObj = {};
      dataObj.auction = {};
      dataObj.user = {};
      dataObj.auction.dbAuctionId = auctionData._id;
      dataObj.auction.name = auctionData.name;
      dataObj.auction.auctionId = auctionData.auctionId;
      dataObj.auction.emdAmount = auctionData.emdAmount;
      dataObj.auction.emdTax = $scope.currentAuction.emdTax;
      dataObj.auction.auctionOwnerMobile = auctionData.auctionOwnerMobile;
      if (userData._id)
        dataObj.user._id = userData._id;
      dataObj.user.fname = userData.fname;
      dataObj.user.lname = userData.lname;
      dataObj.user.countryCode = userData.countryCode ? userData.countryCode : LocationSvc.getCountryCode(userData.country);
      dataObj.user.mobile = userData.mobile;
      if (Auth.getCurrentUser().email)
        dataObj.user.email = Auth.getCurrentUser().email;
      //dataObj.lotNumber = lotData;
      /*if(auctionData.emdTax === 'lotWise')
          dataObj.selectedLots =  lotData;
        else {
          dataObj.selectedLots = [];
          vm.lotList.forEach(function(item){
            dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
          });
        }*/
      userRegForAuctionSvc.checkUserRegis(dataObj)
      .then(function(result){
       if(result.data){
        closeDialog();
          if(result.data =="done"){
             Modal.alert("You have already registered for this auction with lotnumbers" +" "+ result.lotNumber); 
           }
           if(result.data =="undone"){
            Modal.confirm("You have done partial registration, payment part is pending with lotnumbers "+" "+ result.lotNumber,function(isGo){
              if(isGo == 'no'){
                  return;
               }else{
                 Modal.confirm('Do you want to pay online', function(isGo) {
                   if (isGo == 'no'){
                    /*dataObj = {};
                    dataObj.paymentMode = "offline";
                    dataObj.transactionId = result.transactionId;
                    userRegForAuctionSvc.saveOfflineRequest(dataObj).then(function(rd){
                     Modal.alert("data saved Successfully"); 
                     });*/
                     updatePayment(dataObj, result);
                   } else {
                      $rootScope.loading = true;
                      if(result && result.errorCode != 0){
                        $state.go('main');
                        return;
                      }
                      if (result.transactionId) {
                        $rootScope.loading = false;
                        $state.go('payment', {
                        tid: result.transactionId
                        });
                      }
                   }
                 });
               }
               });
            }
        } else {
            if(auctionData.emdTax == "overall") {
              vm.emdAmount = auctionData.emdAmount;
              save(dataObj, vm.emdAmount);
            } else {
              vm.dataModel.auctionId = auctionData._id;
              vm.dataModel.selectedLots = lotData;
              EmdSvc.getAmount(vm.dataModel)
                .then(function(result) {
                  /*console.log("The total Amount", result);
                  dataObj.user.customerId=Auth.getCurrentUser().customerId;
                  dataObj.selectedLots=vm.dataModel.selectedLots;
                  save(dataObj, result[0].emdAmount);*/
                  if(!result)
                      return;
                    $scope.showAlertMsg = true;
                    $scope.emdAmount = result[0].emdAmount;
                    var tempDataObj = {};
                    angular.copy(dataObj, tempDataObj);
                    if(paymentProcess)
                      save(tempDataObj,result[0].emdAmount);
                })
                .catch(function(err) {});
            }
        }
      });
    }

  function updatePayment(dataObj, result) {
    var paymentObj = {};
    if($scope.option.select)
      paymentObj.paymentMode = $scope.option.select;
    paymentObj.transactionId = result.transactionId;
    paymentObj.auctionId = dataObj.auction.auctionId;
    paymentObj.emdTax = dataObj.auction.emdTax;
    paymentObj.requestType = "Auction Request";
    paymentObj.status = transactionStatuses[1].code;
    paymentObj.statuses = [];
    var stObj = {};
    stObj.userId = Auth.getCurrentUser()._id;
    stObj.status = transactionStatuses[1].code;
    stObj.createdAt = new Date();
    paymentObj.statuses[paymentObj.statuses.length] = stObj;
    userRegForAuctionSvc.saveOfflineRequest(paymentObj).then(function(rd){
      Modal.alert("Your payment request submitted Successfully"); 
    });
  }

  function save(dataObj, amount) {
    dataObj.totalAmount = amount;
    //dataObj.requestType = "UserRegAuc";
    userRegForAuctionSvc.save(dataObj)
      .then(function(result) {
        $rootScope.loading = false;
        if($scope.option.select === 'offline') {
          updatePayment(dataObj, result);
        }
        closeDialog();
      })
      .catch(function(err) {
        if (err.data)
          Modal.alert(err.data);
      });
  }

    function closeDialog() {
      $uibModalInstance.dismiss('cancel');
    }
  }

})();