(function() {
  'use strict';

angular.module('sreizaoApp').controller('ViewProductOrRequestDetailCtrl', ViewProductOrRequestDetailCtrl);

function ViewProductOrRequestDetailCtrl($scope, Auth, productSvc, $uibModalInstance) {
    var vm = this;
	vm.closeDialog = closeDialog;
	var filter = {};
	vm.kycList = [];
	function init() {
		getKycInfo($scope.bidData);
		if($scope.bidData && $scope.bidData.product && $scope.bidData.product.proData) {
			filter._id = $scope.bidData.product.proData;
		
			productSvc.getProductOnFilter(filter).then(function(result) {
			 	if(!result)
			 		return;
		    $scope.currentProduct = result[0];
		  });
		}	
	}

	function getKycInfo(kycData) {
		if(kycData.user && kycData.user.kycInfo.length > 0) {
			$scope.kycUploadDir = kycDocDir;
	        angular.copy(kycData.user.kycInfo, vm.kycList);
      	} else if(kycData.kyc.length > 0){
      		$scope.kycUploadDir = kycData.product.assetDir;
	        angular.copy(kycData.kyc, vm.kycList);
      	}
	}

	init();

	function closeDialog() {
		$uibModalInstance.dismiss('cancel');
	}
}

})();