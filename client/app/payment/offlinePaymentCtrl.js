(function(){

'use strict';
angular.module('sreizaoApp').controller('OfflinePaymentCtrl',OfflinePaymentCtrl);

function OfflinePaymentCtrl($scope,$rootScope,Modal,$stateParams,$state,$uibModalInstance, ValuationSvc,PaymentSvc,Auth,userRegForAuctionSvc) {
   
  var vm = this;
  vm.dataModel = {};
  $scope.modeOfPayment = modeOfPayment;
  $scope.transactionStatuses = transactionStatuses;
  vm.save = save;
  vm.closeDialog = closeDialog;

 	function init(){
    if($scope.registerByAdmin) {
      var tid = $stateParams.tid;
      PaymentSvc.getOnFilter({_id:tid})
      .then(function(result){
        if(result.length == 0){
          Modal.alert("Invalid payment access");
          return;
        }
        angular.copy(result[0], vm.dataModel);
        vm.dataModel.paymentMode = $scope.offlinePayment.paymentMode;
        vm.dataModel.amount =  vm.dataModel.totalAmount;
        vm.dataModel.auctionId = $scope.offlinePayment.auctionId;
        vm.dataModel.auction_id = $scope.offlinePayment.auction_id;
        vm.dataModel.auctionType = $scope.offlinePayment.auctionType;
        vm.dataModel.emdTax = $scope.offlinePayment.emdTax;
        vm.dataModel.requestType = "Auction Request";
        vm.dataModel.status = transactionStatuses[5].code;
      })
      .catch(function(err){
        // $state.go("main");
        // Modal.alert("Unknown error occured in payment system");
      })
    } else {
      angular.copy($scope.offlinePayment, vm.dataModel);
      vm.dataModel.amount =  $scope.offlinePayment.totalAmount;
      vm.dataModel.transactionId =  $scope.offlinePayment.transactionId;
      vm.dataModel.auctionType = $scope.offlinePayment.auctionType;
    }
    if($scope.viewMode === 'paymentView') {
      $scope.totalPaidAmount = 0;
      $scope.offlinePayment.payments.forEach(function(item) {
        if(item.paymentStatus !== 'failed')
        $scope.totalPaidAmount = Number($scope.totalPaidAmount) + Number(item.amount);
      });
    }
   }
   
  function save(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    vm.dataModel.totalAmount = vm.dataModel.amount;
    vm.dataModel.paymentMode = "offline";
    if(!vm.dataModel.payments)
      vm.dataModel.payments = [];
    var stsObj = {};
    stsObj.paymentModeType = vm.dataModel.paymentModeType;
    stsObj.refNo = vm.dataModel.refNo;
    stsObj.paymentDate = vm.dataModel.paymentDate;
    stsObj.amount = vm.dataModel.amount;
    stsObj.bankname = vm.dataModel.bankname;
    stsObj.branch = vm.dataModel.branch;
    stsObj.createdAt = new Date();
    stsObj.paymentStatus = "success";
    vm.dataModel.payments[vm.dataModel.payments.length] = stsObj;
    if(!$scope.iValuationFlag) {
      vm.dataModel.reqSubmitStatus = ReqSubmitStatuses[1];
      vm.dataModel.userDataSendToAuction = true;
    }
    $rootScope.loading = true;
    PaymentSvc.updateStatus(vm.dataModel, transactionStatuses[5].code)
    .then(function(res){
        $scope.submitted = false;
        $rootScope.loading = false;
       /* if($scope.generateKitCallback)
          $scope.generateKitCallback(vm.dataModel);
        else
          $rootScope.$broadcast('refreshPaymentHistroyList');*/
		    if(!$scope.iValuationFlag) {
          $rootScope.$broadcast('refreshPaymentHistroyList');
          generateKit(vm.dataModel);
        } else {
          ValuationSvc.updateStatus($scope.valuation, IndividualValuationStatuses[1]);
          submitToAgency($scope.valuation,'Mjobcreation');
        }
        //generateKit(vm.dataModel);
        Modal.alert(res.message);
        closeDialog();
    })
    .catch(function(err){
      if(err.data)
        Modal.alert(err.data);
      $rootScope.loading = false;
      userRegForAuctionSvc.generateKit(vm.dataModel);
      closeDialog();
    });
  }

  function submitToAgency(valuation,type){
    //api integration
    ValuationSvc.submitToAgency(valuation,type)
    .then(function(resList){
      if($scope.callback)
        $scope.callback(true);
    })
    .catch(function(err){
      if(err)
        Modal.alert("Error occured in integration");
      if($scope.callback)
        $scope.callback(true);
    });
  }

  function generateKit(tns){
    if(!tns)
      return;
   $rootScope.loading = true;
    userRegForAuctionSvc.generateKit(tns)
    .then(function(res){
      $rootScope.loading = false;
       $rootScope.$broadcast('refreshPaymentHistroyList');
    })
    .catch(function(err){
      $rootScope.$broadcast('refreshPaymentHistroyList');
      $rootScope.loading = false;
      console.log("Error in kit generation",err);
    });
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }

 	init();
}

})();
