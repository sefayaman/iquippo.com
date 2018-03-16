(function() {
  'use strict';

angular.module('sreizaoApp').controller('PaymentOptionCtrl', PaymentOptionCtrl);

function PaymentOptionCtrl($scope, $rootScope, $state, Modal, Auth, $uibModal, PaymentSvc, ValuationSvc, $uibModalInstance) {
  var vm = this;
  $scope.option = {};
  vm.submit = submit;
  vm.closeDialog = closeDialog;
  $scope.paymentOption = false;
	function init(){
    PaymentSvc.getOnFilter({_id:$scope.tid})
    .then(function(result){
      if(result.length === 0){
        $state.go("main");
        Modal.alert("Invalid payment access");
        return;
      }

      vm.payTransaction = result[0];
      $scope.option.select = vm.payTransaction.paymentMode;
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
    switch ($scope.option.select) {
      case 'paylater':
        $scope.valuation.payOption = "Pay Later";
        ValuationSvc.update($scope.valuation).
        then(function(res) {
          if (res)
            Modal.alert("Thank You for your interest!", true);
        })
        .catch(function(res) {
          console.log(res);
        });
        vm.payTransaction.paymentMode = "";
        PaymentSvc.update(vm.payTransaction);
        if($scope.resetData)
          $rootScope.$broadcast('refreshValuationData');
        if($scope.resetProductData)
          $rootScope.$broadcast('productloaded');
        closeDialog();
        break;
      case 'paynow':
        $scope.paymentOption = true;
        break;
      case 'offline':
        vm.payTransaction.paymentMode = $scope.option.select;
        PaymentSvc.update(vm.payTransaction).
        then(function(res) {
          if (res)
            Modal.alert("Please pay the valuation fee and inform our customer care team.!", true);
          if(!angular.isUndefined($scope.offlineOption))
            $rootScope.$broadcast('refreshValuationList');
        })
        .catch(function(res) {
          console.log(res);
          if(!angular.isUndefined($scope.offlineOption))
            $rootScope.$broadcast('refreshValuationList');
        });
        if($scope.resetData)
          $rootScope.$broadcast('refreshValuationData');
        if($scope.resetProductData)
          $rootScope.$broadcast('productloaded');
        closeDialog();
        break;
      case 'online':
        $state.go('payment', {
          tid: $scope.tid
        });
        closeDialog();
        break;
    }
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