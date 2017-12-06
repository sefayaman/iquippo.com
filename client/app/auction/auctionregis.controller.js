(function() {
'use strict';
angular.module('sreizaoApp').controller('AuctionRegisCtrl', AuctionRegisCtrl);
  
function AuctionRegisCtrl($scope, $rootScope, $location, Modal, Auth,PagerSvc,$uibModalInstance,LotSvc,AuctionSvc, UtilSvc, LocationSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, userRegForAuctionSvc,EmdSvc) {
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
  vm.auctionId ="";
  vm.log =[];
  vm.closeDialog=closeDialog;
  $scope.transactionStatuses = transactionStatuses;
  $scope.errorMsg = "";
  $scope.OverAll = "overall";
  $scope.LotWist = "lotwise";
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
  }

  function submit(lotData, paymentProcess){
    Auth.isLoggedInAsync(function(loggedIn) {
      if (loggedIn) {
        var dataObj = {};
        dataObj.auction = {};
        dataObj.user = {};
        dataObj.auction.dbAuctionId = $scope.currentAuction._id;
        dataObj.auction.name = $scope.currentAuction.name;
        dataObj.auction.auctionId = $scope.currentAuction.auctionId;
        dataObj.auction.emdAmount = $scope.currentAuction.emdAmount;
        dataObj.auction.emdTax = $scope.currentAuction.emdTax;
        dataObj.auction.auctionOwnerMobile = $scope.currentAuction.auctionOwnerMobile;

        if(!Auth.isAdmin()) {
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
          if(!Auth.isAdmin()) {
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
                 Modal.alert("You have already registered for this auction"); 
                 return;
               }
              if(result.data =="undone"){
                Modal.alert("Your EMD payment is still pending. Please pay the EMD amount and inform our customer care team.",true);
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
      } else {
        closeDialog();
        var regUserAuctionScope = $rootScope.$new();
        regUserAuctionScope.currentAuction = $scope.currentAuction;
        Modal.openDialog('auctionRegistration', regUserAuctionScope);
      }
    });
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
    paymentObj.status = transactionStatuses[1].code;
    paymentObj.statuses = [];
    var stObj = {};
    stObj.userId = Auth.getCurrentUser()._id;
    stObj.status = transactionStatuses[1].code;
    stObj.createdAt = new Date();
    paymentObj.statuses[paymentObj.statuses.length] = stObj;
    if(Auth.isAdmin()) {
      var OfflinePaymentScope = $rootScope.$new();
      OfflinePaymentScope.offlinePayment = paymentObj;
      OfflinePaymentScope.viewMode = "paymentAdd";
      OfflinePaymentScope.registerByAdmin = true;
      Modal.openDialog('OfflinePaymentPopup',OfflinePaymentScope);
    } else {
      userRegForAuctionSvc.saveOfflineRequest(paymentObj).then(function(rd){
        Modal.alert("You have sucessfully registered for the auction. Please pay the EMD amount and inform our customer care team."); 
      });
    }
  }
  function save(dataObj,amount){
    dataObj.totalAmount = amount;
    userRegForAuctionSvc.save(dataObj)
    .then(function(result){
      $rootScope.loading = false;
      if($scope.option.select === 'offline') {
        updatePayment(dataObj, result);
      }
      closeDialog();
    })
    .catch(function(err){
      if(err.data)
        Modal.alert(err.data); 
    });
  }
  init();

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}
})();