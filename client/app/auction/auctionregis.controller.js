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
  var dataToSend = {};
  var filter = {};
  vm.submit =submit;
  vm.auctionId ="";
  vm.log =[];
  vm.closeDialog=closeDialog;
  //var query=$scope.params;
  $scope.transactionStatuses = transactionStatuses;
  function init() {
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

        dataObj.user.customerId=Auth.getCurrentUser().customerId;
        dataObj.user._id = Auth.getCurrentUser()._id;
        dataObj.user.fname = Auth.getCurrentUser().fname;
        dataObj.user.lname = Auth.getCurrentUser().lname;
        dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
        dataObj.user.mobile = Auth.getCurrentUser().mobile;
        if(Auth.getCurrentUser().email)
          dataObj.user.email = Auth.getCurrentUser().email;
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
          if(result.data){
            closeDialog();
            if(result.data =="done"){
               Modal.alert("You have already registered for this auction with lotnumbers" +" "+ result.selectedLots); 
             }
             if(result.data =="undone"){
                Modal.confirm("Your EMD payment is still pending. Please pay the EMD amount and inform our customer care team.",function(isGo){
                  if(isGo == 'no'){
                    return;
                } else {
                  Modal.confirm('Do you want to pay online', function(isGo) {
                    if (isGo == 'no'){
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
            if($scope.currentAuction.emdTax =="overall"){
              vm.emdamount = $scope.currentAuction.emdAmount;
              closeDialog();
              save(dataObj,vm.emdamount);
            } else {
              vm.dataModel.auction_id = $scope.currentAuction._id;
              vm.dataModel.selectedLots = vm.dataToSend.selectedLots;
              //closeDialog();
              EmdSvc.getAmount(vm.dataModel).then(function(result){
                    if(!result)
                      return;
                    $scope.showAlertMsg = true;
                    $scope.emdAmount = result[0].emdAmount;
                    var tempDataObj = {};
                    angular.copy(dataObj, tempDataObj);
                    if(paymentProcess)
                      save(tempDataObj,result[0].emdAmount);
                 }).catch(function(err){
               });
              }
          }
        }); 
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
    userRegForAuctionSvc.saveOfflineRequest(paymentObj).then(function(rd){
      Modal.alert("Your payment request submitted Successfully"); 
    });
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