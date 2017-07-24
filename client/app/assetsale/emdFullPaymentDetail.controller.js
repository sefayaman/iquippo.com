(function() {
  'use strict';

angular.module('sreizaoApp').controller('EmdFullPaymentCtrl', EmdFullPaymentCtrl);

function EmdFullPaymentCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.emdFullPaymentInfo = {};
  vm.closeDialog = closeDialog;
  vm.submit = submit;
  
	function submit(form) {
		var ret = false;
	  	if(form.$invalid || ret){
	      form.submitted = true;
	      return;
	    }
		
		//$scope.bidData.kyc[$scope.bidData.kyc.length] = idProofObj;

		var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';
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
}

})();