(function() {
  'use strict';

angular.module('sreizaoApp').controller('ViewProductOrRequestDetailCtrl', ViewProductOrRequestDetailCtrl);

function ViewProductOrRequestDetailCtrl($scope, Auth, productSvc, $uibModalInstance) {
    var vm = this;
	vm.closeDialog = closeDialog;
	var filter = {};

	function init() {
		if($scope.bidData && $scope.bidData.product && $scope.bidData.product.proData) {
			filter._id = $scope.bidData.product.proData;
		
			productSvc.getProductOnFilter(filter).then(function(result) {
			 	if(!result)
			 		return;
		    $scope.currentProduct = result[0];
		  });
		}	
	}

	init();

	function closeDialog() {
		$uibModalInstance.dismiss('cancel');
	}
}

})();