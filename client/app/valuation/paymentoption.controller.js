(function() {
  'use strict';

angular.module('sreizaoApp').controller('PaymentOptionCtrl', PaymentOptionCtrl);

function PaymentOptionCtrl($scope, $rootScope, $state, Modal, Auth, $uibModal, PaymentSvc, ValuationSvc, $uibModalInstance) {
  var vm = this;
  $scope.option = {};
  vm.submit = submit;
  vm.closeDialog = closeDialog;

	function init(){
    PaymentSvc.getOnFilter({_id:$scope.tid})
    .then(function(result){
      if(result.length === 0){
        $state.go("main");
        Modal.alert("Invalid payment access");
        return;
      }

      vm.payTransaction = result[0];
      //PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[1].code);
    })
    .catch(function(err){
      $state.go("main");
      Modal.alert("Unknown error occured in payment system");
    })
	}

  function submit() {
    if(!$scope.option.select) {
      Modal.alert("Please select payment option");
      return;
    }

    if($scope.option.select == 'offline') {
      $scope.valuation.payOption = "Pay Later";
      ValuationSvc.update($scope.valuation).
      then(function(res) {
        if (res)
          Modal.alert("Thank You for your interest!", true);
      })
      .catch(function(res) {
        console.log(res);
      });
      vm.payTransaction.paymentMode = $scope.option.select;
      PaymentSvc.update(vm.payTransaction);
    } else {
      $state.go('payment', {
        tid: $scope.tid
      });
    }
    closeDialog();
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }

  //loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}

})();