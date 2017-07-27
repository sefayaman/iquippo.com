(function() {
  'use strict';

angular.module('sreizaoApp').controller('BidRequestDetailCtrl', BidRequestDetailCtrl);

function BidRequestDetailCtrl($scope, Auth, productSvc, $uibModalInstance) {
    var vm = this;
	vm.closeDialog = closeDialog;
	var filter = {};

	function init() {
		if($scope.data) {
			filter._id = $scope.data._id;
		
			productSvc.getProductOnFilter(filter).then(function(result) {
			 	if(!result)
			 		return;
		    vm.product = result[0];
		  });
		}	
	}

	init();

	function closeDialog() {
		$uibModalInstance.dismiss('cancel');
	}
}

})();