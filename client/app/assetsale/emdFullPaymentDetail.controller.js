(function() {
  'use strict';

angular.module('sreizaoApp').controller('EmdFullPaymentCtrl', EmdFullPaymentCtrl);

function EmdFullPaymentCtrl($scope, $state, $rootScope, Modal, Auth, $uibModal, AssetSaleSvc, $uibModalInstance) {
  	var vm = this;
    vm.emdFullPaymentInfo = {};
    vm.paymentList = [];
    vm.closeDialog = closeDialog;
    vm.submit = submit;
  	var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';

  	function init(){
		if($scope.bidData.emdPayment && $scope.bidData.emdPayment.paymentsDetail && action == 'emdPayment') {
			vm.paymentList = [];
			angular.copy($scope.bidData.emdPayment.paymentsDetail, vm.paymentList);
		} else if($scope.bidData.fullPayment && $scope.bidData.fullPayment.paymentsDetail && action == 'fullPayment') {
			vm.paymentList = [];
			angular.copy($scope.bidData.fullPayment.paymentsDetail, vm.paymentList);
		}
    }

	function submit(form) {
		var ret = false;
	  	if(form.$invalid || ret){
	      form.submitted = true;
	      return;
	    }
		
		//var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';
		if(action == 'emdPayment') {
			if(!$scope.bidData.emdPayment)
				$scope.bidData.emdPayment = {};
			var remAmount = 0;
			//$scope.bidData.emdPayment.paymentMode = 'offline';
			if($scope.bidData.emdPayment.remainingPayment)
				remAmount = $scope.bidData.emdPayment.remainingPayment;
			else
				remAmount = $scope.bidData.emdAmount;
			$scope.bidData.emdPayment.remainingPayment = Number(remAmount) - Number(vm.emdFullPaymentInfo.amount); 
			if(!$scope.bidData.emdPayment.paymentsDetail)
				$scope.bidData.emdPayment.paymentsDetail = [];
			$scope.bidData.emdPayment.paymentsDetail[$scope.bidData.emdPayment.paymentsDetail.length] = vm.emdFullPaymentInfo;
		} else {
			if(!$scope.bidData.fullPayment)
				$scope.bidData.fullPayment = {};
			var remAmount = 0;
			//$scope.bidData.fullPayment.paymentMode = 'offline';
			if($scope.bidData.fullPayment.remainingPayment)
				remAmount = $scope.bidData.fullPayment.remainingPayment;
			else
				remAmount = $scope.bidData.bidAmount - $scope.bidData.emdAmount;
			$scope.bidData.fullPayment.remainingPayment = Number(remAmount) - Number(vm.emdFullPaymentInfo.amount); 
			if(!$scope.bidData.fullPayment.paymentsDetail)
				$scope.bidData.fullPayment.paymentsDetail = [];
			$scope.bidData.fullPayment.paymentsDetail[$scope.bidData.fullPayment.paymentsDetail.length] = vm.emdFullPaymentInfo;
		}
	    AssetSaleSvc.update($scope.bidData, action).
	      then(function(res) {
	        if (res)
	          Modal.alert(res, true);
	      	closeDialog();
	      })
	      .catch(function(res) {
	        console.log(res);
	      });
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