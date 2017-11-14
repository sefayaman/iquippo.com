(function(){

'use strict';
angular.module('sreizaoApp').controller('OfflinePaymentCtrl',OfflinePaymentCtrl);

function OfflinePaymentCtrl($scope,$rootScope,Modal,$stateParams,$state,$uibModalInstance, PaymentSvc,Auth) {
   
  var vm = this;
  vm.dataModel = {};
  $scope.modeOfPayment = modeOfPayment;
  vm.save = save;
  vm.closeDialog = closeDialog;

 	function init(){
    angular.copy($scope.offlinePayment, vm.dataModel);
    vm.dataModel.amount =  $scope.offlinePayment.totalAmount;
    vm.dataModel.transactionId =  $scope.offlinePayment.transactionId;
   }
   
  function save(form){
    if(form.$invalid){
      $scope.submitted = true;
      return;
    }
    vm.dataModel.payments = [];
    var stsObj = {};
    stsObj.paymentModeType = vm.dataModel.paymentModeType;
    stsObj.refNo = vm.dataModel.refNo;
    stsObj.paymentDate = vm.dataModel.paymentDate;
    stsObj.amount = vm.dataModel.amount;
    stsObj.bankname = vm.dataModel.bankname;
    stsObj.branch = vm.dataModel.branch;
    vm.dataModel.payments[vm.dataModel.payments.length] = stsObj;
    vm.dataModel.userDataSendToAuction = true;
    $rootScope.loading = true;
    PaymentSvc.updateStatus(vm.dataModel, transactionStatuses[5].code)
    .then(function(res){
        vm.dataModel = {};
        $scope.submitted = false;
        $rootScope.loading = false;
        $rootScope.$broadcast('refreshPaymentHistroyList');
        Modal.alert(res.message);
        //Modal.alert('Payment Request save successfully!');
        closeDialog();
    })
    .catch(function(err){
    if(err.data)
      Modal.alert(err.data); 
    $rootScope.loading = false;
    });
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }

 	init();
}

})();
