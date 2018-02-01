(function() {
  'use strict';

angular.module('sreizaoApp').controller('BidRequestDetailCtrl', BidRequestDetailCtrl);

function BidRequestDetailCtrl($scope, Auth, productSvc, $uibModalInstance,AssetSaleSvc) {
    var vm = this;
	vm.closeDialog = closeDialog;
	var filter = {};
	vm.kycList = [];
	$scope.dayDiff = AssetSaleSvc.ageingOfAssetInPortal;

	function init() {
		if($scope.bidData) 
			getKycInfo($scope.bidData);
		if($scope.data) {
			getKycInfo($scope.data);
			filter._id = $scope.data._id;
			productSvc.getProductOnFilter(filter).then(function(result) {
			 	if(!result)
			 		return;
		    vm.product = result[0];
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