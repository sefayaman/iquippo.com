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
  	vm.visibleFlag = true;
  	function init(){
		if($scope.bidData.emdPayment && $scope.bidData.emdPayment.paymentsDetail && action == 'emdPayment') {
			vm.paymentList = [];
			vm.visibleFlag = $scope.bidData.emdPayment.remainingPayment < 1 ? false : true;
			angular.copy($scope.bidData.emdPayment.paymentsDetail, vm.paymentList);
		} else if($scope.bidData.fullPayment && $scope.bidData.fullPayment.paymentsDetail && action == 'fullPayment') {
			vm.paymentList = [];
			vm.visibleFlag = $scope.bidData.fullPayment.remainingPayment < 1 ? false : true;
			angular.copy($scope.bidData.fullPayment.paymentsDetail, vm.paymentList);
		}
    }

	function submit(form) {
		if(form.$invalid){
	      form.submitted = true;
	      return;
	    }
		
		//var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';

		if(action == 'emdPayment') {
			// if(vm.emdFullPaymentInfo.amount > $scope.bidData.emdPayment.remainingPayment) {
			// 	Modal.alert("Please enter correct amount!");
			// 	return;
			// }
			if(!$scope.bidData.emdPayment)
				$scope.bidData.emdPayment = {};
			$scope.bidData.emdPayment.remainingPayment = (Number($scope.bidData.emdPayment.remainingPayment) - Number(vm.emdFullPaymentInfo.amount)) || 0; 
			if(!$scope.bidData.emdPayment.paymentsDetail)
				$scope.bidData.emdPayment.paymentsDetail = [];
			vm.emdFullPaymentInfo.createdAt = new Date();
			$scope.bidData.emdPayment.paymentsDetail[$scope.bidData.emdPayment.paymentsDetail.length] = vm.emdFullPaymentInfo;
		} else {
			// if(vm.emdFullPaymentInfo.amount > $scope.bidData.fullPayment.remainingPayment) {
			// 	Modal.alert("Please enter correct amount!");
			// 	return;
			// }
			if(!$scope.bidData.fullPayment)
				$scope.bidData.fullPayment = {};
			$scope.bidData.fullPayment.remainingPayment = (Number($scope.bidData.fullPayment.remainingPayment) - Number(vm.emdFullPaymentInfo.amount)) || 0; 
			if(!$scope.bidData.fullPayment.paymentsDetail)
				$scope.bidData.fullPayment.paymentsDetail = [];
			vm.emdFullPaymentInfo.createdAt = new Date();
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