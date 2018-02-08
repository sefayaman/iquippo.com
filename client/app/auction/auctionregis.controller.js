(function() {
'use strict';
angular.module('sreizaoApp').controller('AuctionRegisCtrl', AuctionRegisCtrl);
  
function AuctionRegisCtrl($scope, $rootScope, $location, Modal, Auth,PagerSvc,KYCSvc,userSvc,uploadSvc,$uibModalInstance,LotSvc,AuctionSvc, UtilSvc, LocationSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, userRegForAuctionSvc,EmdSvc) {
  var vm = this;
  var listingCount = {};
  $scope.option = {};
  vm.show = false;
  vm.auctionListing = [];
  vm.dataModel = {};
  vm.lotList=[];
  vm.lotListEmd = [];
  var dataToSend = {};
  var filter = {};
  vm.submit =submit;
  $scope.uploadKyc = uploadKyc;
  $scope.onRadioClick = onRadioClick;
  vm.auctionId ="";
  vm.log =[];
  vm.closeDialog=closeDialog;
  $scope.transactionStatuses = transactionStatuses;
  $scope.errorMsg = "";
  $scope.OverAll = "overall";
  $scope.LotWist = "lotwise";
  $scope.option.select = 'offline';
  $scope.kyc = {};
  $scope.kycUpdateNow = false;
  $scope.typeList = ['Address Proof', 'Identity Proof'];
  $scope.kycInfo = {};
  $scope.addressProofList = [];
  $scope.idProofList = [];
  
  function init() {
    if($scope.regLots && $scope.regLots.length > 0){
      var lots = $scope.regLots.join();
      $scope.regLot = lots;
    }
    filter = {};
    filter._id = $scope.currentAuction._id;
    EmdSvc.getData(filter).then(function(res){
        if(!res)
          return;
        vm.lotListEmd = res; 
        $scope.showAlertMsg = false;
      }).catch(function(err){
    });
    LotSvc.getData({auction_id:$scope.currentAuction._id}).then(function(res){
      vm.lotList = res;
    });
    getKYCData();
  }

   function getKYCData() {
      KYCSvc.get().then(function(result) {
        if(!result)
          return;
        
        result.forEach(function(item){
          if(item.kycType == $scope.typeList[0])
            $scope.addressProofList[$scope.addressProofList.length] = item;
          if(item.kycType == $scope.typeList[1])
             $scope.idProofList[$scope.idProofList.length] = item; 
        });
      });
    }

    function onRadioClick(boolVal){
      $scope.submitted = false;
      $scope.kycUpdateNow = boolVal;
    }

    function uploadKyc(files, _this, type){
      if(files.length == 0)
        return;
      $rootScope.loading = true;
      uploadSvc.upload(files[0], kycDocDir).then(function(result){
          $rootScope.loading = false;
            if(type == 'addressProof'){
              $scope.kycInfo.addressProofDocName = result.data.filename;
            }
            if(type == 'idProof'){
                $scope.kycInfo.idProofDocName = result.data.filename;
            }
        })
        .catch(function(err){
          $rootScope.loading = false;
        });
    }

  function updateUser(form,cb){
      if(form.$invalid){
        $scope.submitted = true;
        return;
      }
      if(!$scope.kycInfo.idProofDocName || !$scope.kycInfo.addressProofDocName){
        Modal.alert("Please upload kyc document");
        return;
      }
      $rootScope.loading = true;
      var userObj = {};
      userObj.kycInfo = [];
      if($scope.kycInfo.idProofDocName){
        var obj = {
                    type:"Identity Proof",
                    name : $scope.kycInfo.idProof,
                    docName:$scope.kycInfo.idProofDocName,
                    isActive:false
                  }
        userObj.kycInfo.push(obj);
      };
       if($scope.kycInfo.addressProofDocName){
        var obj = {
                    type:"Identity Proof",
                    name : $scope.kycInfo.addressProof,
                    docName:$scope.kycInfo.addressProofDocName,
                    isActive:false
                  }
        userObj.kycInfo.push(obj);
      };
      userObj._id = Auth.getCurrentUser()._id;
      userSvc.updateUser(userObj).then(function(result){
        $rootScope.loading = false;
        if(cb)
          cb(true);
      })
       .catch(function(){
           Modal.alert("Unable to update kyc detail");
          $rootScope.loading = false;
       });
  }

  function submit(lotData, paymentProcess){
    if(paymentProcess && !$scope.kycExist) {
      $scope.kycExist = false;
      if(!Auth.getCurrentUser().kycInfo || Auth.getCurrentUser().kycInfo.length < 1){
        $scope.kycUpdateNow = true;
        $scope.kycExist = true;
        return;
      }
    }

   if(paymentProcess && $scope.kycExist && $scope.kycUpdateNow)
      updateUser(lotData,function(){
        proceedToSubmit(paymentProcess);
    });
    else
      proceedToSubmit(paymentProcess);
  }

  function proceedToSubmit(paymentProcess){
    var dataObj = {};
    dataObj.auction = {};
    dataObj.user = {};
    dataObj.auction.dbAuctionId = $scope.currentAuction._id;
    dataObj.auction.name = $scope.currentAuction.name;
    dataObj.auction.auctionId = $scope.currentAuction.auctionId;
    dataObj.auction.emdAmount = $scope.currentAuction.emdAmount;
    dataObj.auction.emdTax = $scope.currentAuction.emdTax;
    dataObj.auction.auctionOwnerMobile = $scope.currentAuction.auctionOwnerMobile;

    if(!Auth.isAdmin() && !Auth.isAuctionRegPermission()) {
      dataObj.user.customerId = Auth.getCurrentUser().customerId;
      dataObj.user._id = Auth.getCurrentUser()._id;
      dataObj.user.fname = Auth.getCurrentUser().fname;
      dataObj.user.lname = Auth.getCurrentUser().lname;
      dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
      dataObj.user.mobile = Auth.getCurrentUser().mobile;
      if(Auth.getCurrentUser().email)
        dataObj.user.email = Auth.getCurrentUser().email;
    } else {
      dataObj.user.batonNo = $scope.registerUser.batonNo;
      dataObj.user.customerId = $scope.registerUser.customerId;
      dataObj.user._id = $scope.registerUser._id;
      dataObj.user.fname = $scope.registerUser.fname;
      dataObj.user.lname = $scope.registerUser.lname;
      dataObj.user.countryCode = LocationSvc.getCountryCode($scope.registerUser.country);
      dataObj.user.mobile = $scope.registerUser.mobile;
      if($scope.registerUser.email)
        dataObj.user.email = $scope.registerUser.email;
    }
    if($scope.currentAuction.emdTax === $scope.OverAll){
      dataObj.selectedLots = [];
      vm.lotList.forEach(function(item){
        dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
      });
      vm.emdamount = $scope.currentAuction.emdAmount;
      closeDialog();
      save(dataObj,vm.emdamount);
    } else {
      if (angular.isUndefined(vm.dataToSend)) {
        Modal.alert("Atleast one lot should be selected"); 
        return;
      }
      var lotsArr = [];
      for (var i=0; i < vm.dataToSend.selectedLots.length; i++) {
        for (var j=0; j < vm.dataToSend.selectedLots[i].length; j++)
          lotsArr.push(vm.dataToSend.selectedLots[i][j]);
      }
      dataObj.selectedLots = lotsArr;
      var validateData = {};
      validateData.auction = {};
      validateData.user = {};
      validateData.auction.dbAuctionId = $scope.currentAuction._id;
      validateData.selectedLots = lotsArr;
      if(!Auth.isAdmin() && !Auth.isAuctionRegPermission()) {
        validateData.user._id = Auth.getCurrentUser()._id;
        validateData.user.mobile = Auth.getCurrentUser().mobile;
      } else {
        validateData.user._id = $scope.registerUser._id;
        validateData.user.mobile = $scope.registerUser.mobile;
      }
      userRegForAuctionSvc.checkUserRegis(validateData).then(function(result){
        if(result.data){
          closeDialog();
          if(result.data =="done"){
            Modal.alert(informationMessage.auctionRegMsg, true);
            return;
          }
          if(result.data =="undone"){
            Modal.alert(informationMessage.auctionPaymentPendingMsg,true);
            return;
          }
        }
        vm.dataModel.auction_id = $scope.currentAuction._id;
        vm.dataModel.selectedLots = lotsArr;
        EmdSvc.getAmount(vm.dataModel).then(function(result){
              if(!result)
                return;
              $scope.showAlertMsg = true;
              $scope.emdAmount = result.emdAmount;
              var tempDataObj = {};
              angular.copy(dataObj, tempDataObj);
              if(paymentProcess)
                save(tempDataObj,result.emdAmount);
           }).catch(function(err){
         });
      });
    }

  }

  function updatePayment(dataObj, result) {
    var paymentObj = {};
    if($scope.option.select)
      paymentObj.paymentMode = $scope.option.select;
    paymentObj.transactionId = result.transactionId;
    paymentObj.auctionId = dataObj.auction.auctionId;
    paymentObj.auction_id = dataObj.auction.dbAuctionId;
    paymentObj.emdTax = dataObj.auction.emdTax;
    paymentObj.requestType = "Auction Request";
    if($scope.kyc.kycUploadlater)
      paymentObj.kycUploadlater = "Yes";
    paymentObj.status = transactionStatuses[1].code;
    paymentObj.statuses = [];
    var stObj = {};
    stObj.userId = Auth.getCurrentUser()._id;
    stObj.status = transactionStatuses[1].code;
    stObj.createdAt = new Date();
    paymentObj.statuses[paymentObj.statuses.length] = stObj;
    userRegForAuctionSvc.saveOfflineRequest(paymentObj).then(function(rd){
      if(Auth.isAdmin() || Auth.isAuctionRegPermission()) {
        var OfflinePaymentScope = $rootScope.$new();
        OfflinePaymentScope.offlinePayment = paymentObj;
        OfflinePaymentScope.viewMode = "paymentAdd";
        OfflinePaymentScope.registerByAdmin = true;
        Modal.openDialog('OfflinePaymentPopup',OfflinePaymentScope);
      } else
        Modal.alert(informationMessage.auctionPaymentSuccessMsg, true); 
    });
  }

  function save(dataObj, amount){
    dataObj.totalAmount = amount;
    dataObj.emd = amount;
    userRegForAuctionSvc.save(dataObj)
    .then(function(result){
      $rootScope.loading = false;
      if($scope.option.select === 'offline') {
        updatePayment(dataObj, result);
      } else {
        var paymentObj = {};
        paymentObj.paymentMode = $scope.option.select;
        paymentObj.transactionId = result.transactionId;
        paymentObj.auctionId = dataObj.auction.auctionId;
        paymentObj.auction_id = dataObj.auction.dbAuctionId;
        paymentObj.emdTax = dataObj.auction.emdTax;
        paymentObj.requestType = "Auction Request";
        paymentObj.status = transactionStatuses[1].code;
        if($scope.kyc.kycUploadlater)
          paymentObj.kycUploadlater = "Yes";
        paymentObj.totalAmount = dataObj.totalAmount;
        userRegForAuctionSvc.saveOfflineRequest(paymentObj).then(function(rd){
          $state.go("auctionpayment", {
                tid: rd._id
              });
        });
      }
      closeDialog();
    })
    .catch(function(err){
      if(err.data)
        Modal.alert(err.data); 
    });
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
  //Entry point
   Auth.isLoggedInAsync(function(loggedIn) {
      if (loggedIn) {
        init();
      }else{
        closeDialog();
        var regUserAuctionScope = $rootScope.$new();
        regUserAuctionScope.currentAuction = $scope.currentAuction;
        Modal.openDialog('auctionRegistration', regUserAuctionScope);
      }
    });
}
})();