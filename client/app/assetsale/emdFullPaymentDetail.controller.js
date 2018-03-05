(function() {
  'use strict';

angular.module('sreizaoApp').controller('EmdFullPaymentCtrl', EmdFullPaymentCtrl);

function EmdFullPaymentCtrl($scope, $state, $rootScope, Modal, Auth, $uibModal, AssetSaleSvc, $uibModalInstance) {
  	var vm = this;
    vm.emdFullPaymentInfo = {};
    vm.paymentList = [];
    vm.closeDialog = closeDialog;
    vm.submit = submit;
    $scope.modeOfPayment = modeOfPayment;
  	var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';
  	vm.visibleFlag = true;
  	function init(){
		if($scope.bidData.emdPayment && $scope.bidData.emdPayment.paymentsDetail && action == 'emdPayment') {
			vm.paymentList = [];
			$scope.totalPaidAmount = 0;
			vm.visibleFlag = $scope.bidData.emdPayment.remainingPayment > 0 ? true : false;
			$scope.bidData.emdPayment.paymentsDetail.forEach(function(item) {
              $scope.totalPaidAmount = Number($scope.totalPaidAmount) + Number(item.amount);
            });
			angular.copy($scope.bidData.emdPayment.paymentsDetail, vm.paymentList);
		} else if($scope.bidData.fullPayment && $scope.bidData.fullPayment.paymentsDetail && action == 'fullPayment') {
			vm.paymentList = [];
			$scope.totalPaidAmount = 0;
			$scope.receivedAmount = 0;
			$scope.bidData.emdPayment.paymentsDetail.forEach(function(item) {
              $scope.receivedAmount = Number($scope.receivedAmount) + Number(item.amount);
            });
			vm.visibleFlag = $scope.bidData.fullPayment.remainingPayment > 0 ? true : false;
			$scope.bidData.fullPayment.paymentsDetail.forEach(function(item) {
              $scope.totalPaidAmount = Number($scope.totalPaidAmount) + Number(item.amount);
            });
            $scope.receivedAmount = $scope.receivedAmount + $scope.totalPaidAmount;
			angular.copy($scope.bidData.fullPayment.paymentsDetail, vm.paymentList);
		}
    }

	function submit(form) {
		if(form.$invalid){
	      $scope.submitted = true;
	      return;
	    }
		var msg = "";
		var serverAction = "";
		if(vm.emdFullPaymentInfo.paymentMode === 'Cash')
			vm.emdFullPaymentInfo.instrumentNo = "";

		if(action == 'emdPayment') {
			if(!$scope.bidData.emdPayment)
				$scope.bidData.emdPayment = {};
			if((Number($scope.bidData.emdAmount + $scope.bidData.fullPaymentAmount) < vm.emdFullPaymentInfo.amount) || vm.emdFullPaymentInfo.amount <= 0) {
				Modal.alert("Invalid payment amount.");
				return;
			}

			var remainingPayment = (Number($scope.bidData.emdPayment.remainingPayment || 0) - Number(vm.emdFullPaymentInfo.amount)) || 0
			$scope.bidData.emdPayment.remainingPayment = remainingPayment > 0? remainingPayment: 0;
			$scope.bidData.emdPayment.remainingPayment = Math.round($scope.bidData.emdPayment.remainingPayment || 0) //(Number($scope.bidData.emdPayment.remainingPayment || 0) - Number(vm.emdFullPaymentInfo.amount)) || 0; 
			if(!$scope.bidData.emdPayment.paymentsDetail)
				$scope.bidData.emdPayment.paymentsDetail = [];
			vm.emdFullPaymentInfo.createdAt = new Date();
			$scope.bidData.emdPayment.paymentsDetail[$scope.bidData.emdPayment.paymentsDetail.length] = vm.emdFullPaymentInfo;
			if(remainingPayment < 0 && $scope.bidData.fullPayment && $scope.bidData.fullPayment.remainingPayment)
				$scope.bidData.fullPayment.remainingPayment = Math.round(Number($scope.bidData.fullPayment.remainingPayment) + remainingPayment) || 0;

			/*if($scope.bidData.fullPayment && $scope.bidData.fullPayment.remainingPayment < 0){
				Modal.alert("Invalid payment amount.");
				return;
			}*/
			
			if($scope.bidData.emdPayment.remainingPayment === 0){
				serverAction = "emdpayment";
				AssetSaleSvc.setStatus($scope.bidData,dealStatuses[7],'dealStatus','dealStatuses');
				msg = informationMessage.EMDPayment;
			} else msg = informationMessage.partialEMD;

			if($scope.bidData.fullPayment && $scope.bidData.emdPayment.remainingPayment === 0 && $scope.bidData.fullPayment.remainingPayment <= 0){
				serverAction = "fullpayment";
				AssetSaleSvc.setStatus($scope.bidData,dealStatuses[8],'dealStatus','dealStatuses');
				msg = informationMessage.Fullpayment;
			}
		} else {
			if(!$scope.bidData.fullPayment)
				$scope.bidData.fullPayment = {};
			var remainingPayment = (Number($scope.bidData.fullPayment.remainingPayment) - Number(vm.emdFullPaymentInfo.amount)) || 0;
			if(remainingPayment < 0 || vm.emdFullPaymentInfo.amount <= 0){
				Modal.alert("Invalid payment amount.");
				return;
			}
			$scope.bidData.fullPayment.remainingPayment = Math.round(remainingPayment); 
			if(!$scope.bidData.fullPayment.paymentsDetail)
				$scope.bidData.fullPayment.paymentsDetail = [];
			vm.emdFullPaymentInfo.createdAt = new Date();
			$scope.bidData.fullPayment.paymentsDetail[$scope.bidData.fullPayment.paymentsDetail.length] = vm.emdFullPaymentInfo;
			if($scope.bidData.fullPayment.remainingPayment == 0){
			 serverAction = "fullpayment";
			 AssetSaleSvc.setStatus($scope.bidData,dealStatuses[8],'dealStatus','dealStatuses');
			 msg = informationMessage.Fullpayment;
			} else  msg = informationMessage.partialFullpayment;
		}
	    AssetSaleSvc.update($scope.bidData,serverAction).
	      then(function(res) {
	      	if(msg)
	      		Modal.alert(msg, true);	
	        else if(res)
	          Modal.alert(res, true);
	      	closeDialog();
	      	if($scope.callback)
	      		$scope.callback();
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